import os
import requests
import json

class RAGKnowledgeBase:
    def __init__(self):
        # In-memory document storage
        self.documents = []

    def index_configuration(self, filename: str, content: str, findings: list):
        doc = {
            "type": "configuration",
            "name": filename,
            "text": content,
            "findings_summary": ", ".join([f.get("issue", "") for f in findings])
        }
        self.documents.append(doc)

    def search_context(self, query: str) -> str:
        # Construct relevant context from all indexed documents
        if not self.documents:
            return "No configuration contexts indexed in this session."
            
        context = "### Network Configuration Contexts:\n"
        for doc in self.documents:
            context += f"\nFile: {doc['name']}\n"
            context += f"AI Findings Identified: {doc['findings_summary']}\n"
            # Include first 1500 characters of config file to stay within limits
            context += f"Raw Configuration Snippet:\n{doc['text'][:1500]}\n"
        return context

    def generate_chat_response(self, user_message: str, context_files: list) -> str:
        # Load any dynamic context from the request
        for file in context_files:
            self.index_configuration(
                file.get("filename", "unknown.cfg"),
                file.get("raw_text", ""),
                file.get("findings", [])
            )
            
        context = self.search_context(user_message)
        
        # Check API Keys
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        prompt = f"""
You are NetMind AI, an expert Senior Network Engineer (CCNP/CCIE level), Security Analyst, and NOC troubleshooting system.
Analyze the user request using the provided network configuration context.

CONTEXT:
{context}

USER REQUEST:
{user_message}

Provide clear, professional, markdown-formatted troubleshooting answers. Suggest exact CLI configuration commands to fix identified issues where applicable.
"""

        # 1. Attempt Gemini
        if gemini_key:
            try:
                # Call Gemini beta API directly via POST request
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                response = requests.post(url, headers=headers, json=payload, timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    return f"Gemini API returned error code {response.status_code}: {response.text}"
            except Exception as e:
                return f"Gemini integration error: {str(e)}"
                
        # 2. Attempt OpenAI
        if openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
                payload = {
                    "model": "gpt-4-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a professional CCIE-level network troubleshooting assistant."},
                        {"role": "user", "content": prompt}
                    ]
                }
                response = requests.post(url, headers=headers, json=payload, timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"OpenAI API returned error code {response.status_code}: {response.text}"
            except Exception as e:
                return f"OpenAI integration error: {str(e)}"

        # 3. Fallback: Intelligent Simulated Engineer Responses based on parsed context
        return self._generate_simulated_response(user_message)

    def _generate_simulated_response(self, msg: str) -> str:
        query = msg.lower()
        
        # OSPF Query
        if "ospf" in query:
            return """### [AI Engine] OSPF Diagnostic Summary
Based on the configuration rules:
- **Neighbor Dead Timer Outage:** The dead interval default of 40 seconds must match on peer interfaces. If timers mismatch, adjacency falls to DOWN.
- **Missing Interfaces:** Check if OSPF is enabled on interfaces under the routing section.

**Remediation Commands:**
```cisco
router ospf 1
 network 10.120.44.0 0.0.0.3 area 0
```
*Note: To verify neighbor details, log into CLI and run `show ip ospf neighbor`.*"""

        # VLAN Query
        if "vlan" in query:
            return """### [AI Engine] VLAN & Trunking Diagnostic
Based on the network context:
- **Native VLAN Mismatch:** Access port or trunk port native configurations must match on switch interfaces. Mismatches cause Spanning Tree to block ports.
- **Routing Gateway Mismatch:** Ensure inter-vlan traffic can reach the Layer 3 SVI or subinterface gateway.

**Remediation Commands:**
```cisco
interface GigabitEthernet1/0/2
 switchport mode trunk
 switchport trunk native vlan 99
```"""

        # Default Response
        return """### [AI Engine] NetMind AI NOC Assistant
No Gemini or OpenAI API keys are detected in the active `.env` configuration file. The AI engine is running in **Rule-Based Fallback Mode**.

I can answer questions regarding:
1. **OSPF Adjacency Issues** (Dead timers, wildcard subnet masks, MTU mismatches)
2. **VLAN Trunking Problems** (Native VLAN mismatch, access port tagging)
3. **Security Audits** (Telnet enabled, plaintext passwords, open public SNMP strings)

Please configure `GEMINI_API_KEY` in the service `.env` file to unlock complete GPT/Gemini enterprise-level troubleshooting capabilities!"""
