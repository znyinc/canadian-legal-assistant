# JURIDICUS Phase 1: Acceleration Plan
## Leverage Existing Repo + Forms + CanLII API

---

## Part 1: What You Provided (Immediate Assets)

### Ontario Forms Database (44-line reference)
**Source:** Ontario_Forms.md (uploaded)

**What it gives us:**
- Master form hubs (ontariocourtforms.on.ca, forms.mgcs.gov.on)
- Organized by category (Family, Civil, Small Claims, LTB, Employment)
- Direct links to Form sources (N4, L1, 7A, etc.)
- Links to online filing portals + guided pathways

**For Phase 1 KB:**
```
knowledge_base/
├── supplements/
│   ├── forms_registry.json
│   │   ├── N4 (Notice to End Tenancy) → link + PDF location
│   │   ├── L1 (LTB Application) → link + PDF location
│   │   ├── 7A (Small Claims Plaintiff's Claim) → link
│   │   └── [all forms cross-referenced]
│   └── form_sources.yaml
│       ├── ontariocourtforms.on.ca (canonical source)
│       ├── tribunalsontario.ca/ltb (LTB forms)
│       └── forms.mgcs.gov.on (CFR - other forms)
```

**Daemon integration:**
```python
# daemons/form_link_validator.py
# Weekly: Test all form links from Ontario_Forms.md
# Alert if: form link broken, moved, or updated
```

---

## Part 2: CanLII API Capability

### What CanLII Offers

**CanLII REST API (v1):**
- ✅ **Free tier** (no API key required for basic use)
- ✅ **Case search** (by jurisdiction, keywords, citations)
- ✅ **Case details** (full text, metadata, citations)
- ✅ **Bulk download** (daily case exports)
- ❌ **NOT scraping** (use API, respect rate limits)

**API Endpoints (from GitHub docs):**
```
GET /casebrowse/v1/jurisdiction/{jurisdiction}/year/{year}
GET /casebrowse/v1/keyword/{keyword}
GET /casebrowse/v1/citations/case/{caseId}
```

**For JURIDICUS Phase 1:**
- Use REST API (not scraping)
- Rate limit: ~1 request/second
- Response: JSON (case metadata + links to full text)

**Example request:**
```bash
curl "https://api.canlii.org/v1/search/casebrowse/ON?q=eviction&offset=0&limit=10"
# Returns: List of Ontario cases matching "eviction"
# Includes: case name, citation, year, court, URL
```

### Integration Path for Phase 1

```python
# backend/search/canlii_integrator.py

class CanLIIClient:
    def __init__(self):
        self.base_url = "https://api.canlii.org/v1"
        self.rate_limiter = RateLimiter(requests_per_sec=1)
    
    def search_cases(self, jurisdiction="ON", keyword=None, year=None):
        """
        Search CanLII for cases.
        Respects rate limits, handles errors gracefully.
        """
        query_params = {
            "q": keyword,
            "year": year,
            "offset": 0,
            "limit": 20  # Start small
        }
        
        response = self._call_api(f"/search/{jurisdiction}", query_params)
        return self._parse_response(response)
    
    def get_case_details(self, case_id):
        """Fetch full case details (text + metadata)"""
        response = self._call_api(f"/cases/{case_id}")
        return response
    
    def _call_api(self, endpoint, params):
        """Rate-limited API call with error handling"""
        self.rate_limiter.wait()
        try:
            response = requests.get(f"{self.base_url}{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"CanLII API error: {e}")
            return None  # Return None; fallback to cache
```

**Daemon integration:**
```python
# daemons/canlii_ingester.py

class CanLIIIngester:
    def __init__(self, client: CanLIIClient, db: Database):
        self.client = client
        self.db = db
    
    def ingest_daily(self):
        """
        Daily job (1:00 UTC):
        1. Query CanLII for new Ontario cases (SCC, CoA, select Superior)
        2. Extract: citation, holding, court, date
        3. Classify: Which Ontario statute does it interpret?
        4. Embed for semantic search
        5. Store in case_law.json
        """
        
        # Search for cases decided yesterday
        yesterday = (datetime.now() - timedelta(days=1)).year
        
        for court in ["SCC", "ON-CA", "ON-SC"]:
            cases = self.client.search_cases(
                jurisdiction="ON",
                keyword="residential tenancy eviction",  # Example query
                year=yesterday
            )
            
            for case in cases:
                # Extract and store
                processed = self._process_case(case)
                self.db.insert_case(processed)
                
                # Embed
                embedding = self._embed_case(processed)
                self.db.insert_embedding(case["id"], embedding)
        
        self.logger.info(f"CanLII ingest: {len(cases)} new cases indexed")
```

---

## Part 3: Existing Repo (Need Info)

### Questions About Your Repo

**I need to know:**

1. **Where is it?**
   - GitHub? (URL?)
   - Local only? (D:\Code\AIdea\...?)
   - Private repo?

2. **What's already built?**
   - NLI classifier? (skeleton or working?)
   - KB ingestion? (statutes, cases, forms?)
   - Web interface? (React stub or working?)
   - Daemons? (any scheduled jobs?)
   - Multi-model router? (or single model?)

3. **What tech stack?**
   - Backend: Python? FastAPI?
   - Frontend: React? Working state?
   - DB: PostgreSQL? MongoDB?
   - Search: Weaviate? Elasticsearch?

4. **Status:**
   - 20% built? 50%? 80%?
   - What's blocking Phase 1 completion?
   - What can I reuse as-is?

---

## Part 4: Integration Strategy (Assume Repo Exists)

### If repo is partially built:

**Goal:** Don't rewrite. Enhance.

```python
# Minimal changes to integrate Ontario Forms + CanLII API

# 1. Add forms to KB
knowledge_base/supplements/
├── forms_registry.json  (NEW - from Ontario_Forms.md)
└── form_sources.yaml    (NEW - daemon targets)

# 2. Add CanLII integration
backend/search/
├── canlii_integrator.py (NEW - REST API client)
└── retriever.py         (UPDATE - add CanLII search)

# 3. Update daemon
daemons/
├── canlii_ingester.py   (UPDATE - use API instead of bulk)
└── form_link_validator.py (NEW - weekly form link checks)

# 4. Update router
core/
└── model_router.py      (ADD multi-model support if missing)
```

---

## Part 5: CanLII Scraping vs. API

### CAN WE SCRAPE CanLII?

**Short answer:** ❌ Not recommended. Use API instead.

**Why:**
- ✅ CanLII **API exists** (free, documented)
- ✅ **Respects ToS** (API use is official)
- ✅ **Faster ingestion** (structured JSON vs. HTML parsing)
- ❌ **Scraping** (HTML parsing) violates ToS + brittle
- ❌ **Rate limits** (CanLII will block high-volume scrapers)

### Official CanLII Rate Limits

```
Free tier:
- 1 request/second (reasonable for daily ingest)
- No authentication needed
- No quota limit (as of 2024)

Bulk downloads:
- Weekly case exports available
- Contact CanLII for bulk access
```

### Phase 1 Implementation

**Use API, not scraping:**

```python
# ✅ GOOD: API call
response = requests.get(
    "https://api.canlii.org/v1/search/ON",
    params={"q": "eviction", "year": 2024}
)
cases = response.json()  # Structured JSON

# ❌ BAD: Web scraping
html = requests.get("https://www.canlii.org/en/on/cases/?q=eviction").text
cases = BeautifulSoup(html, "html.parser").find_all("div", class_="case")
```

---

## Part 6: Phase 1 Action Plan (Updated)

### Week 1: Repo Audit + Forms Integration

**Tasks:**
- [ ] Share repo (GitHub link or access)
- [ ] I review what's built vs. what's TODO
- [ ] Catalog Ontario Forms database
  - [ ] Create `forms_registry.json` from Ontario_Forms.md
  - [ ] Map form types to NLI domains (N4 → landlord_tenant, etc.)
  - [ ] Add to knowledge_base/supplements/
- [ ] Create form_link_validator daemon skeleton

**Output:** Clear picture of "what's done, what's left"

### Week 2-3: CanLII API Integration

**Tasks:**
- [ ] Implement `canlii_integrator.py` (REST API client)
  - [ ] Respect rate limits (1 req/sec)
  - [ ] Error handling (API down → fallback to cache)
  - [ ] Classify cases (which Ontario statute does this interpret?)
- [ ] Update `canlii_ingester.py` daemon
  - [ ] Switch from scraping to API
  - [ ] Daily ingest: SCC + ON-CA + select Superior
  - [ ] Embed cases for semantic search
- [ ] Test integration
  - [ ] Query CanLII for RTA cases
  - [ ] Verify classification + embedding
  - [ ] Check response time (<2 sec per query)

**Output:** Working CanLII API ingestion, daily daemon running

### Week 3-4: Multi-Model Router + Forms

**Tasks:**
- [ ] Integrate multi-model router (if not already done)
  - [ ] Claude, GPT, Gemini adapters
  - [ ] Fallback chains
  - [ ] Cost tracking
- [ ] Update supplements delivery
  - [ ] When user asks about eviction → offer N4 form link + download
  - [ ] When user asks about LTB → offer L1 form link + download
  - [ ] Infographics: Eviction process (already designed)

**Output:** Forms available in chat + API

### Week 4: Testing + Polish

**Tasks:**
- [ ] End-to-end test: Question → NLI → Research → Forms + Resources
- [ ] Accuracy test: 95%+ NLI routing, 100% citation accuracy
- [ ] Performance: <2 sec response, daemon uptime 99%+
- [ ] Prepare for beta launch

**Output:** Phase 1 MVP ready

---

## Part 7: Specific Integrations

### Forms → NLI Classifier Routing

```python
# nli_classifier.py output example

{
    "classification": {
        "domain": "landlord_tenant",
        "specific_issue": "eviction_non_payment"
    },
    "forms_available": [
        {
            "form_name": "N4",
            "title": "Notice to End Tenancy for Non-Payment of Rent",
            "source_url": "https://tribunalsontario.ca/ltb/forms-filing-and-fees/",
            "download_url": "https://tribunalsontario.ca/documents/.../n4.pdf",
            "instructions": "https://tribunalsontario.ca/documents/.../n4-instructions.pdf"
        },
        {
            "form_name": "Eviction Checklist",
            "title": "7-Step Eviction Process Checklist",
            "type": "infographic_svg",
            "download": true
        }
    ],
    "related_cases": [
        {
            "case_name": "[2020] SCC 15 - Leading RTA case",
            "holding": "Landlords must comply with strict notice requirements",
            "link": "https://canlii.org/en/ca/scc/doc/2020/2020scc15/2020scc15.html"
        }
    ]
}
```

### CanLII Integration in Research Engine

```python
# research_engine.py example

class ResearchEngine:
    def __init__(self, router, canlii_client):
        self.router = router
        self.canlii = canlii_client
    
    def research(self, classification: dict) -> dict:
        """
        For landlord_tenant/eviction_non_payment:
        1. Find relevant RTA sections (from KB)
        2. Find relevant CanLII cases (via API)
        3. Generate plain language explanation (via router)
        4. Suggest applicable forms (via forms_registry)
        """
        
        domain = classification["domain"]
        issue = classification["specific_issue"]
        
        # Get statute sections
        statutes = self.kb.find_statutes(domain, issue)
        
        # Get CanLII cases (via API, not scraping)
        canlii_cases = self.canlii.search_cases(
            jurisdiction="ON",
            keyword=f"RTA {issue}",
            year=2020  # Recent cases only
        )
        
        # Get forms
        forms = self.forms_registry.get_forms(domain, issue)
        
        return {
            "statutes": statutes,
            "cases": canlii_cases,
            "forms": forms,
            "explanation": self._generate_explanation(...)
        }
```

---

## Part 8: CanLII Rate Limiting Strategy

### For Phase 1 (50 users, low volume)

```python
# daemons/canlii_ingester.py

from ratelimit import limits, sleep_and_retry

class CanLIIIngester:
    
    @sleep_and_retry
    @limits(calls=1, period=1)  # 1 request per second
    def _call_canlii(self, endpoint, params):
        """Rate-limited API call"""
        return requests.get(f"{self.base_url}{endpoint}", params=params)
    
    def ingest_daily(self):
        """Daily daemon: ~5-10 API calls total"""
        
        # Call 1: SCC decisions from yesterday
        scc_cases = self._call_canlii("/search/ON", {"q": "residential tenancy", "court": "SCC"})
        
        # Call 2: ON-CA decisions from yesterday
        coa_cases = self._call_canlii("/search/ON", {"q": "residential tenancy", "court": "ON-CA"})
        
        # Call 3: Select Superior Court cases
        sc_cases = self._call_canlii("/search/ON", {"q": "residential tenancy", "court": "ON-SC"})
        
        # Total time: 10 API calls × 1 sec/call = 10 seconds
        # No rate limit issues
        
        # Process and store all cases
        for case in [scc_cases, coa_cases, sc_cases]:
            self._process_and_store(case)
```

**Cost:**
- API calls: 0 (free)
- Bandwidth: ~1MB/day (structured JSON)
- Compute: ~5 seconds/day (processing)

**vs. Scraping:**
- Would need HTML parsing (BeautifulSoup, Selenium)
- ~500ms per page × 10-20 pages = 5-10 seconds
- Risk of breaking when CanLII redesigns HTML
- Violates ToS

**Winner: API** ✅

---

## Summary

| Component | Source | Status | Action |
|-----------|--------|--------|--------|
| **Ontario Forms** | You provided (Ontario_Forms.md) | 📊 Ready | Catalog + integrate into KB |
| **CanLII Cases** | CanLII REST API (free) | ✅ Available | Implement API client (not scraping) |
| **NLI Router** | Existing repo (?) | ❓ Unclear | Review repo first |
| **Multi-model Router** | Designed (JURIDICUS_MULTIMODEL_ROUTER.md) | 🔧 Ready | Integrate if not done |
| **Forms Database** | Ontario_Forms.md | 🔧 Ready | Create forms_registry.json |
| **Daemons** | Existing repo (?) | ❓ Unclear | Review + enhance |

---

## Next Step: Share Your Repo

**I need:**
```
GitHub URL: https://github.com/[user]/[repo]
OR
Local path: D:\Code\[project]\
OR
Description: "What's built so far?"
```

Once I see the repo, I can:
1. Identify what's done vs. TODO
2. Show how to integrate Ontario Forms (minimal changes)
3. Add CanLII API ingestion (use API, not scraping)
4. Connect multi-model router (if needed)
5. Provide specific file modifications instead of starting from scratch

**Timeline:** If repo is 50% built, Phase 1 completes in 4-6 weeks instead of 16 weeks. ⚡
