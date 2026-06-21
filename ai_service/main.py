import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re
from dotenv import load_dotenv

# Import our helpers
from parser import NetworkConfigParser
from rules import NetworkRulesEngine
from rag import RAGKnowledgeBase

load_dotenv()

app = FastAPI(title="NetMind AI Troubleshooting Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_db = RAGKnowledgeBase()

# Pydantic Schemas
class ConfigPayload(BaseModel):
    filename: str
    content: str

class LogPayload(BaseModel):
    raw_log: str

class ChatPayload(BaseModel):
    session_id: str
    user_message: str
    context_files: List[Dict[str, Any]] = []

class TopologyPayload(BaseModel):
    raw_output: str
    local_device_name: Optional[str] = "Local-Router"

# Routes
@app.post("/api/ai/analyze-config")
def analyze_config(payload: ConfigPayload):
    try:
        content = payload.content
        filename = payload.filename.lower()
        
        parsed_data = {}
        if "juniper" in filename or "junos" in filename or "commit" in content.lower():
            parsed_data = NetworkConfigParser.parse_juniper(content)
        elif "nokia" in filename or "sros" in content.lower():
            parsed_data = NetworkConfigParser.parse_nokia(content)
        else:
            # Default Cisco parser
            parsed_data = NetworkConfigParser.parse_cisco(content)
            
        findings = NetworkRulesEngine.analyze(parsed_data)
        
        return {
            "parsed_data": parsed_data,
            "findings": findings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/analyze-log")
def analyze_log(payload: LogPayload):
    try:
        raw_log = payload.raw_log
        raw_lower = raw_log.lower()
        
        # Simple rule-based log classifier
        severity = "Info"
        explanation = ""
        
        if "ospf" in raw_lower:
            explanation = "OSPF state transition detected. If adjacency is lost, check link duplex parameters, MTU configs, or network subnet mask mappings."
            severity = "Critical" if "down" in raw_lower else "Warning"
        elif "link-3-updown" in raw_lower or "updown" in raw_lower:
            explanation = "Interface physical status transitioned. Check cabling, power lines, or patch-panel connections."
            severity = "Warning"
        elif "ssh" in raw_lower or "login" in raw_lower or "auth" in raw_lower:
            explanation = "User administrative connection log. Verify source IP ranges to confirm authorized connection attempts."
            severity = "Info" if "success" in raw_lower else "Warning"
        else:
            explanation = "System diagnostics telemetry event logged. Standard operation info."
            severity = "Info"
            
        return {
            "explanation": explanation,
            "severity": severity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat")
def chat_rag(payload: ChatPayload):
    try:
        reply = rag_db.generate_chat_response(
            payload.user_message,
            payload.context_files
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/topology")
def parse_topology(payload: TopologyPayload):
    try:
        text = payload.raw_output
        local_dev = payload.local_device_name or "Core-SW-01"
        
        nodes = [{"id": local_dev, "label": local_dev, "type": "Core Router"}]
        edges = []
        
        # Standard Cisco CDP output parser
        # Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
        # R2               Gig 0/0           120        R           C7200     Gig 0/1
        lines = text.split("\n")
        cdp_started = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Identify columns start
            if "Device ID" in line or "Local Intrfce" in line:
                cdp_started = True
                continue
                
            if cdp_started:
                # Check for system status headers or prompt lines, ignore
                if line.startswith("Total cdp") or line.startswith("#") or ">" in line:
                    continue
                    
                tokens = re.split(r"\s{2,}", line) # Split by multiple spaces
                if len(tokens) >= 4:
                    remote_device = tokens[0]
                    local_interface = tokens[1]
                    remote_interface = tokens[-1]
                    
                    # Add remote node
                    if not any(n["id"] == remote_device for n in nodes):
                        node_type = "Switch"
                        if "router" in remote_device.lower() or "r" in remote_device.lower():
                            node_type = "Router"
                        elif "ap" in remote_device.lower():
                            node_type = "Access Point"
                            
                        nodes.append({"id": remote_device, "label": remote_device, "type": node_type})
                        
                    # Add connection
                    edges.append({
                        "from": local_dev,
                        "to": remote_device,
                        "label": f"{local_interface} -> {remote_interface}"
                    })
                    
        # If no explicit links parsed, generate a mock topology for demo purposes
        if len(edges) == 0:
            nodes = [
                {"id": local_dev, "label": local_dev, "type": "Core Switch"},
                {"id": "Router-GW", "label": "Router-GW", "type": "Router"},
                {"id": "Branch-SW-1", "label": "Branch-SW-1", "type": "Switch"},
                {"id": "Branch-SW-2", "label": "Branch-SW-2", "type": "Switch"},
                {"id": "AccessPoint-1", "label": "AccessPoint-1", "type": "Access Point"}
            ]
            edges = [
                {"from": local_dev, "to": "Router-GW", "label": "Gig1/0/1 -> Gig0/0"},
                {"from": local_dev, "to": "Branch-SW-1", "label": "Gig1/0/2 -> Gig1/0/24"},
                {"from": local_dev, "to": "Branch-SW-2", "label": "Gig1/0/3 -> Gig1/0/24"},
                {"from": "Branch-SW-1", "to": "AccessPoint-1", "label": "Gig1/0/10 -> Eth0"}
            ]
            
        return {
            "nodes": nodes,
            "edges": edges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
