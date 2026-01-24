# BUSINESS SCIENCE
# SQL Database Agent App
# -----------------------

# This app is designed to help you query your SQL database and return data frames that you can interactively inspect and download.

# Imports
# !pip install git+https://github.com/business-science/ai-data-science-team.git --upgrade

from openai import OpenAI

import streamlit as st
import sqlalchemy as sql
import pandas as pd
import asyncio
import inspect
from pathlib import Path

from langchain_community.chat_message_histories import StreamlitChatMessageHistory
from langchain_openai import ChatOpenAI

try:
    from langchain_ollama import ChatOllama  # type: ignore
except ImportError:
    ChatOllama = None

from ai_data_science_team.agents import SQLDatabaseAgent

# * APP INPUTS ----

# MODIFY THIS TO YOUR DATABASE PATH IF YOU WANT TO USE A DIFFERENT DATABASE
# Get the project root (2 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent
DB_PATH = PROJECT_ROOT / "data" / "northwind.db"

DB_OPTIONS = {
    "Northwind Database": f"sqlite:///{DB_PATH}",
}

OPENAI_MODEL_LIST = ['gpt-4o-mini', 'gpt-4o']
OLLAMA_DEFAULT_MODEL = 'llama3.1:8b'
OLLAMA_DEFAULT_URL = 'http://localhost:11434'

TITLE = "Your SQL Database Agent"

# * STREAMLIT APP SETUP ----

st.set_page_config(page_title=TITLE, page_icon="📊", )
st.title(TITLE)

st.markdown("""
Welcome to the SQL Database Agent. This AI agent is designed to help you query your SQL database and return data frames that you can interactively inspect and download.
""")

with st.expander("Example Questions", expanded=False):
    st.write(
        """
        - What tables exist in the database?
        - What are the first 10 rows in the territory table?
        - Aggregate sales for each territory. 
        - Aggregate sales by month for each territory.
        """
    )

# * STREAMLIT APP SIDEBAR ----

# Database Selection

db_option = st.sidebar.selectbox(
    "Select a Database",
    list(DB_OPTIONS.keys()),
)

st.session_state["PATH_DB"] = DB_OPTIONS.get(db_option)

sql_engine = sql.create_engine(st.session_state["PATH_DB"])

conn = sql_engine.connect()

# * LLM Provider Selection

st.sidebar.header("LLM Provider")

llm_provider = st.sidebar.selectbox(
    "Choose LLM Provider",
    ["OpenAI", "Ollama"],
    index=0,
    help="Choose OpenAI (cloud) or Ollama (local)."
)

# * OpenAI Configuration
if llm_provider == "OpenAI":
    st.sidebar.header("OpenAI Configuration")
    
    st.session_state["OPENAI_API_KEY"] = st.sidebar.text_input(
        "API Key", 
        type="password", 
        help="Your OpenAI API key is required for the app to function.",
        key="openai_api_key_input"
    )
    
    # Test OpenAI API Key
    if st.session_state["OPENAI_API_KEY"]:
        # Set the API key for OpenAI
        client = OpenAI(api_key=st.session_state["OPENAI_API_KEY"])
        
        # Test the API key (optional)
        try:
            # Example: Fetch models to validate the key
            models = client.models.list()
            st.success("API Key is valid!")
        except Exception as e:
            st.error(f"Invalid API Key: {e}")
    else:
        st.info("Please enter your OpenAI API Key to proceed.")
        st.stop()
    
    # OpenAI Model Selection
    model_option = st.sidebar.selectbox(
        "Choose OpenAI model",
        OPENAI_MODEL_LIST,
        index=0,
        key="openai_model_select"
    )
    
    llm = ChatOpenAI(
        model=model_option,
        api_key=st.session_state["OPENAI_API_KEY"]
    )

# * Ollama Configuration
else:  # Ollama
    if ChatOllama is None:
        st.sidebar.error(
            "Ollama support requires `langchain-ollama`. Install it with `pip install langchain-ollama`."
        )
        st.stop()
    
    st.sidebar.header("Ollama Configuration")
    
    default_ollama_url = (
        st.session_state.get("ollama_base_url") or OLLAMA_DEFAULT_URL
    )
    default_ollama_model = (
        st.session_state.get("ollama_model") or OLLAMA_DEFAULT_MODEL
    )
    
    ollama_base_url = st.sidebar.text_input(
        "Ollama base URL",
        value=default_ollama_url,
        key="ollama_base_url_input",
        help="Usually `http://localhost:11434`.",
    ).strip()
    
    ollama_model = st.sidebar.text_input(
        "Ollama model",
        value=default_ollama_model,
        key="ollama_model_input",
        help="Example: `llama3.1:8b` (run `ollama list` to see what's installed).",
    ).strip()
    
    st.session_state["ollama_base_url"] = ollama_base_url
    st.session_state["ollama_model"] = ollama_model
    
    if not ollama_model:
        st.sidebar.error("Ollama model name is required.")
        st.stop()
    
    # Create Ollama LLM
    kwargs: dict[str, object] = {"model": ollama_model}
    base_url = ollama_base_url.strip()
    if base_url:
        try:
            sig = inspect.signature(ChatOllama)
            if "base_url" in sig.parameters:
                kwargs["base_url"] = base_url
            elif "ollama_base_url" in sig.parameters:
                kwargs["ollama_base_url"] = base_url
        except Exception:
            kwargs["base_url"] = base_url
    
    llm = ChatOllama(**kwargs)
    
    # Optional: Test Ollama connection
    if st.sidebar.button("Test Ollama connection", key="ollama_test"):
        try:
            import requests
            url = f"{ollama_base_url.rstrip('/')}/api/tags"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                if models_data.get("models"):
                    st.sidebar.success(f"Connected! Found {len(models_data['models'])} model(s).")
                else:
                    st.sidebar.warning("Connected, but no models were returned. Run `ollama list` to confirm.")
            else:
                st.sidebar.error(f"Ollama returned status code {response.status_code}")
        except Exception as e:
            st.sidebar.error(f"Could not connect to Ollama at `{ollama_base_url}`: {e}")
            st.sidebar.info("Tip: start Ollama with `ollama serve` and pull a model with `ollama pull <model>`.")

# * STREAMLIT 

# Set up memory
msgs = StreamlitChatMessageHistory(key="langchain_messages")
if len(msgs.messages) == 0:
    msgs.add_ai_message("How can I help you?")

# Initialize dataframe storage in session state
if "dataframes" not in st.session_state:
    st.session_state.dataframes = []

# Function to display chat messages including Plotly charts and dataframes
def display_chat_history():
    for i, msg in enumerate(msgs.messages):
        with st.chat_message(msg.type):
            if "DATAFRAME_INDEX:" in msg.content:
                df_index = int(msg.content.split("DATAFRAME_INDEX:")[1])
                st.dataframe(st.session_state.dataframes[df_index])
            else:
                st.write(msg.content)

# Render current messages from StreamlitChatMessageHistory
display_chat_history()

# Create the SQL Database Agent
sql_db_agent = SQLDatabaseAgent(
    model = llm,
    connection=conn,
    n_samples=1,
    log = False,
    bypass_recommended_steps=True,
)

# Handle the question async
async def handle_question(question):
    await sql_db_agent.ainvoke_agent(
        user_instructions=question,
    )
    return sql_db_agent


if st.session_state["PATH_DB"] and (question := st.chat_input("Enter your question here:", key="query_input")):
    
    # Validate provider-specific requirements
    if llm_provider == "OpenAI":
        if not st.session_state.get("OPENAI_API_KEY"):
            st.error("Please enter your OpenAI API Key to proceed.")
            st.stop()
    elif llm_provider == "Ollama":
        if not st.session_state.get("ollama_model"):
            st.error("Please enter an Ollama model name to proceed.")
            st.stop()
    
    with st.spinner("Thinking..."):
        
        st.chat_message("human").write(question)
        msgs.add_user_message(question)
        
        # Run the app       
        error_occured = False
        try: 
            print(st.session_state["PATH_DB"])
            result = asyncio.run(handle_question(question))
        except Exception as e:
            error_occured = True
            print(e)
            
            response_text = f"""
            I'm sorry. I am having difficulty answering that question. You can try providing more details and I'll do my best to provide an answer.
            
            Error: {e}
            """
            msgs.add_ai_message(response_text)
            st.chat_message("ai").write(response_text)
            st.error(f"Error: {e}")
        
        # Generate the Results
        if not error_occured:
            
            sql_query = result.get_sql_query_code()
            response_df = result.get_data_sql()
            
            if sql_query:
                
                # Store the SQL
                response_1 = f"### SQL Results:\n\nSQL Query:\n\n```sql\n{sql_query}\n```\n\nResult:"
                
                # Store the forecast df and keep its index
                df_index = len(st.session_state.dataframes)
                st.session_state.dataframes.append(response_df)

                # Store response
                msgs.add_ai_message(response_1)
                msgs.add_ai_message(f"DATAFRAME_INDEX:{df_index}")
                
                # Write Results
                st.chat_message("ai").write(response_1)
                st.dataframe(response_df)
        
