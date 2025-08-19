# 📋 HR AI SaaS - Detailed Project Discussion Log

## 🎯 Project Core Concept
HR recruitment tool to scan resumes faster using AI analysis.

**Workflow**: Sign in → Create Role → Select Role → Upload Resumes → AI Evaluation → Analytics Dashboard

---

## 🔍 Feature Analysis & Discussion Log

### 1. User Authentication & Sign-in
**User Requirement**: 
- Google OAuth or normal email/password sign-in
- Each user has isolated data (roles, results, etc.)
- Dashboard after sign-in showing user's stuff

### 2. Create Role Functionality  
**User Requirement**:
- User creates job roles with specifications
- Role details will be sent to AI along with resumes for evaluation

---

## 📊 Migration Guide Analysis

### 1. ✅ **SIGN-IN FUNCTIONALITY - FOUND**

**Database Schema (Lines 43-54):**
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  google_id TEXT,        -- Google OAuth support
  microsoft_id TEXT,     -- Microsoft OAuth support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Components (Lines 543-546):**
- `login-form.tsx` 
- `register-form.tsx`
- `auth-provider.tsx`

**Backend API (Lines 503-505):**
- `/api/auth/callback/route.ts`

**Authentication System (Line 29):**
- Supabase Auth (replaces NextAuth + Azure AD)
- Multi-provider: Google, Email/Password (Line 14)

**Data Isolation:** ✅ Each user has isolated data via `user_id` foreign keys

---

### 2. ✅ **CREATE ROLE FUNCTIONALITY - FOUND**

**Database Schema (Lines 57-93):**

**Main Roles Table (Lines 57-70):**
```sql
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 2 AND length(title) <= 120),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 2500),
  responsibilities TEXT CHECK (length(responsibilities) <= 2500),
  education_requirements JSONB DEFAULT '{"hasRequirements": false, "requirements": ""}',
  experience_requirements JSONB DEFAULT '{"hasRequirements": false, "requirements": ""}',
  bonus_config JSONB,
  penalty_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Role Skills Table (Lines 73-82):**
```sql
CREATE TABLE public.role_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL CHECK (length(skill_name) >= 1 AND length(skill_name) <= 200),
  skill_category TEXT CHECK (length(skill_category) <= 50),
  weight INTEGER NOT NULL CHECK (weight >= 1 AND weight <= 10),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Role Questions Table (Lines 85-93):**
```sql
CREATE TABLE public.role_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL CHECK (length(question_text) >= 5 AND length(question_text) <= 200),
  category TEXT CHECK (length(category) <= 50),
  weight INTEGER NOT NULL CHECK (weight >= 1 AND weight <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend Components (Lines 551-555):**
- `role-form.tsx` - Role creation form
- `role-list.tsx` - Display user's roles
- `skills-matrix.tsx` - Skills management
- `questions-builder.tsx` - Custom questions

**Backend API (Lines 506-509):**
- `/api/roles/route.ts` - CRUD operations
- `/api/roles/[id]/route.ts` - Individual role management

**Hooks & Services (Lines 580, 574-577):**
- `use-roles.ts` - React hook for role management
- Various services for backend operations

---

## 🎯 **ANALYSIS RESULT:**

✅ **BOTH FEATURES FULLY COVERED** in the migration guide with:
- Complete database schema
- Frontend components 
- Backend APIs
- Authentication system
- Data isolation
- Comprehensive role creation with skills and questions

**Status:** Ready for your review/confirmation or modifications!

---

WH Y## 📝 **DETAILED BREAKDOWN: CREATE ROLE FUNCTIONALITY**

### **Database Structure (3 Tables)**

#### 1. **Main Roles Table** (`public.roles`)
- **id**: Unique identifier (UUID)
- **user_id**: Links role to specific user (data isolation)
- **title**: Job title (2-120 chars)
- **description**: Role description (10-2500 chars)
- **responsibilities**: Job responsibilities (up to 2500 chars)
- **education_requirements**: JSON object with structure:
  ```json
  {
    "hasRequirements": false,
    "requirements": ""
  }
  ```
- **experience_requirements**: Same JSON structure as education
- **bonus_config**: JSON for bonus scoring rules
- **penalty_config**: JSON for penalty scoring rules
- **is_active**: Boolean to enable/disable role
- **timestamps**: created_at, updated_at

#### 2. **Role Skills Table** (`public.role_skills`)
Each role can have multiple skills:
- **skill_name**: Name of required skill (1-200 chars)
- **skill_category**: Category grouping (up to 50 chars)
- **weight**: Importance level (1-10 scale)
- **is_required**: Boolean for mandatory vs optional skills
- Links to role via `role_id`

#### 3. **Role Questions Table** (`public.role_questions`)
Custom evaluation questions per role:
- **question_text**: The question to evaluate (5-200 chars)
- **category**: Question category (up to 50 chars)
- **weight**: Importance level (1-10 scale)
- Links to role via `role_id`

### **Frontend Components**

#### `role-form.tsx`
- Form for creating/editing roles
- Input fields for all role properties
- Dynamic skills addition/removal
- Dynamic questions addition/removal
- Validation for required fields

#### `role-list.tsx`
- Display all user's created roles
- Filter/search capabilities
- Quick actions (edit, delete, duplicate)
- Shows active/inactive status

#### `skills-matrix.tsx`
- Skills management interface
- Add/remove skills
- Set skill weights (1-10)
- Categorize skills
- Mark as required/optional

#### `questions-builder.tsx`
- Custom questions interface
- Add/remove questions
- Set question weights
- Categorize questions
- Preview mode

### **Backend API Endpoints**

#### `/api/roles/route.ts`
- **GET**: List all roles for authenticated user
- **POST**: Create new role with skills and questions

#### `/api/roles/[id]/route.ts`
- **GET**: Get specific role details
- **PUT**: Update role information
- **DELETE**: Delete role (cascade deletes skills & questions)

### **Data Flow for Role Creation**

1. **User clicks "Create New Role"**
2. **Fills out role-form.tsx**:
   - Basic info (title, description, responsibilities)
   - Education requirements (toggle + text)
   - Experience requirements (toggle + text)
   - Adds skills with weights
   - Adds custom questions with weights
   - Sets bonus/penalty configs

3. **Form submission**:
   - Validates all fields
   - Sends POST to `/api/roles/`
   - Creates role entry
   - Creates associated skills entries
   - Creates associated questions entries

4. **Role usage**:
   - Available in evaluation dropdown
   - Sent to AI with resume for analysis
   - Used for scoring calculations

### **Key Features**
- **Weighted Scoring**: Both skills and questions have 1-10 weights
- **Categories**: Organize skills and questions
- **Flexibility**: Optional vs required skills
- **Reusability**: Roles can be used for multiple evaluations
- **User Isolation**: Each user only sees their own roles

---

## 🤖 **AI PROMPT STRUCTURE - CRITICAL DESIGN**

### **❌ MISSING IN MIGRATION GUIDE**: No AI prompt structure found!

### **🎯 REFINED SCORING METHODOLOGY SUMMARY**

**Core Innovation: Multi-Tier Evaluation System**
- **Tier 1**: Binary Pass/Fail for critical requirements (Education, Experience, Mandatory Skills)
- **Tier 2**: Weighted scoring with dynamic redistribution
- **Tier 3**: Fine-tuning with bonus/penalty modifiers

**Key Features:**
1. **Immediate Rejection** - If education/experience required but missing → Score = 0
2. **Dynamic Weights** - Automatically redistributes weights when fields absent
3. **Mandatory Skills** - 3x weight multiplier for critical skills
4. **Clear Decision Trail** - Shows exactly why candidate passed/failed
5. **Tiebreaker System** - Bonus/penalty differentiates similar candidates

**Proportional Weight System:**
- Base weights: Education(25) + Experience(30) + Skills(25) + Questions(10) + Modifiers(10)
- Only active components are included in calculation
- Scale factor = 100 / sum_of_active_weights
- Each weight multiplied by scale factor to maintain proportions
- Always totals to 100% regardless of configuration

### **7-Layer Dynamic Prompt Architecture**

#### **Layer 1: System Context**
```
You are an expert HR AI assistant specializing in resume evaluation.
Your task is to evaluate a candidate's resume against a specific job role.
You must provide objective, weighted scoring based on the provided criteria.
```

#### **Layer 2: Role Definition** 
Dynamically injects job details:
- Title, Description, Responsibilities
- Education Requirements (conditional)
- Experience Requirements (conditional)

#### **Layer 3: Skills Evaluation**
For each skill in role_skills:
- Skill name with category
- Weight (1-10 scale)
- MANDATORY flag (2x impact if true)
- Instructions for exact/similar/transferable skill matching

#### **Layer 4: Custom Questions**
For each question in role_questions:
- Question text with category
- Weight (1-10 scale)
- Must provide evidence from resume

#### **Layer 5: Resume Content**
- Full extracted resume text
- Contact info (if available)

#### **Layer 6: Advanced Multi-Tier Scoring Methodology**

**TIER 1: HARD REQUIREMENTS (Pass/Fail - Immediate Rejection if Failed)**
```
1. Education Requirement Check:
   - If required AND not met = REJECT (score: 0)
   
2. Experience Requirement Check:
   - If required AND not met = REJECT (score: 0)
   
3. Mandatory Skills Check:
   - If ANY skill marked as MANDATORY is missing = REJECT (score: 0)
```

**TIER 2: PROPORTIONAL SCORING (If Pass Tier 1)**
```
Base Weights:
- Education Quality (if required): 25
- Experience Quality (if required): 30
- Skills Score: 25
- Questions Score (if any): 10
- Modifiers (if configured): 10

Proportional Scaling Formula:
1. Sum active weights (only included if requirement exists)
2. Scale factor = 100 / sum_of_active_weights
3. Final weight = base_weight × scale_factor

Examples:
- Full requirements: 25+30+25+10+10 = 100 (no scaling needed)
- No education: 30+25+10+10 = 75 → scale by 1.33
- Only skills: 25 → scale by 4 (skills become 100%)
```

**FINAL SCORE FORMULA:**
```
IF (failed_hard_requirements) {
  final_score = 0
  status = "REJECTED"
} ELSE {
  final_score = (
    critical_requirements_score * weight_critical +
    skills_score * weight_skills +
    questions_score * weight_questions +
    modifier_score
  )
  status = "PASSED"
}
```

#### **Layer 7: Two-Tier JSON Output Format**

## **TIER 1: TABLE VIEW OUTPUT**
*Concise data for main dashboard - one row per resume*

```json
{
  "table_view": {
    "candidate_name": "string",
    "score": 0-100,
    "status": "QUALIFIED|NOT_QUALIFIED|REJECTED",
    "match_level": "PERFECT|STRONG|GOOD|FAIR|POOR",
    "education_met": boolean,
    "experience_met": boolean,
    "mandatory_skills_met": boolean,
    "missing_skills_count": number,
    "recommendation": "INTERVIEW|REVIEW|REJECT",
    "priority": "HIGH|MEDIUM|LOW",
    "key_strength": "string (one-liner)",
    "key_concern": "string (one-liner)",
    "salary_range": "string",
    "flight_risk": "HIGH|MEDIUM|LOW"
  }
}
```

### **Dynamic Handling for Table View:**
- **If no education required**: `education_met` = true (auto-pass)
- **If no experience required**: `experience_met` = true (auto-pass)
- **If no mandatory skills**: `mandatory_skills_met` = true, `missing_skills_count` = 0
- **If no salary data**: `salary_range` = "Market Rate"
- **Match level calculation**: Based on score (90+ PERFECT, 80-89 STRONG, 70-79 GOOD, 60-69 FAIR, <60 POOR)

## **TIER 2: EXPANDED VIEW OUTPUT**
*Detailed analysis when user clicks on candidate*

```json
{
  "expanded_view": {
    // ====== SUMMARY SECTION ======
    "summary": {
      "decision": "QUALIFIED|NOT_QUALIFIED|REJECTED",
      "score": 0-100,
      "confidence": 0-100,
      "evaluation_summary": "string (3-5 sentences)"
    },

    // ====== CANDIDATE INFO ======
    "candidate": {
      "name": "string",
      "email": "string|null",
      "phone": "string|null",
      "location": "string|null",
      "current_role": "string|null",
      "years_experience": number
    },

    // ====== REQUIREMENTS ANALYSIS ======
    "requirements_analysis": {
      "education": {
        "required": "string|Not Required",
        "found": "string|Not Applicable",
        "met": boolean,
        "quality": "EXCEEDS|MEETS|BELOW|NOT_APPLICABLE"
      },
      "experience": {
        "required": "string|Not Required",
        "found": "string|Not Applicable",
        "met": boolean,
        "quality": "EXCEEDS|MEETS|BELOW|NOT_APPLICABLE"
      },
      "mandatory_skills": {
        "total": number,
        "met": number,
        "missing": ["array of missing skills"],
        "percentage": 0-100
      }
    },

    // ====== DETAILED SCORING ======
    "detailed_scores": {
      "total": 0-100,
      "education": 0-100,
      "experience": 0-100,
      "skills": 0-100,
      "questions": 0-100,
      "bonus": 0-10,
      "penalty": -10-0,
      "final": 0-100
    },

    // ====== SKILLS MATRIX (Dynamic) ======
    "skills_assessment": [
      {
        "name": "string",
        "required": boolean,
        "found": boolean,
        "level": "HIGH|MEDIUM|LOW|NONE"
      }
      // Dynamically generated for all skills in role
    ],

    // ====== QUESTIONS ASSESSMENT (Dynamic) ======
    "questions_assessment": [
      {
        "question": "string",
        "answer": "YES|NO|PARTIAL",
        "quality": "HIGH|MEDIUM|LOW|NONE"
      }
      // Dynamically generated for all questions in role
    ],

    // ====== ANALYSIS ======
    "analysis": {
      "strengths": ["array of key strengths"],
      "concerns": ["array of key concerns"],
      "mitigations": ["how to address concerns"]
    },

    // ====== HR GUIDANCE ======
    "hr_guidance": {
      "recommendation": "PROCEED_TO_INTERVIEW|SCHEDULE_REVIEW|REJECT",
      "urgency": "string",
      "interview_focus": ["array of focus areas"],
      "negotiation_notes": "string",
      "onboarding_needs": ["array of training needs"],
      "retention_strategy": "string"
    },

    // ====== MARKET INTELLIGENCE ======
    "market_position": {
      "candidate_tier": "A|B|C|D",
      "market_demand": "HIGH|MEDIUM|LOW",
      "likely_competing": boolean,
      "time_to_move": "string",
      "counter_offer_risk": "HIGH|MEDIUM|LOW"
    },

    // ====== VERIFICATION NEEDED ======
    "verify": ["array of items to verify"]
  }
}
```

### **Dynamic Handling for Expanded View:**

#### **When Education Not Required:**
```json
"education": {
  "required": "Not Required",
  "found": "Bachelor's in Marketing", // Still show if found
  "met": true, // Always true if not required
  "quality": "NOT_APPLICABLE"
}
```

#### **When No Skills Required:**
```json
"mandatory_skills": {
  "total": 0,
  "met": 0,
  "missing": [],
  "percentage": 100 // Perfect score if none required
}
```

#### **When No Questions Provided:**
```json
"questions_assessment": [] // Empty array
```

#### **Score Calculation with Dynamic Weights:**
```javascript
// Dynamic weight calculation based on what's present
function calculateDynamicScore(components) {
  let activeWeights = {};
  let baseWeights = {
    education: 25,
    experience: 30,
    skills: 25,
    questions: 10,
    modifiers: 10
  };
  
  // Only include active components
  if (hasEducationRequirement) activeWeights.education = baseWeights.education;
  if (hasExperienceRequirement) activeWeights.experience = baseWeights.experience;
  if (hasSkills) activeWeights.skills = baseWeights.skills;
  if (hasQuestions) activeWeights.questions = baseWeights.questions;
  if (hasModifiers) activeWeights.modifiers = baseWeights.modifiers;
  
  // Calculate scale factor
  const sum = Object.values(activeWeights).reduce((a, b) => a + b, 0);
  const scaleFactor = 100 / sum;
  
  // Apply scaled weights
  let finalScore = 0;
  for (let component in activeWeights) {
    const scaledWeight = activeWeights[component] * scaleFactor;
    finalScore += (componentScores[component] * scaledWeight / 100);
  }
  
  return finalScore;
}
```

### **Handling Edge Cases:**

1. **No Requirements at All (only skills):**
   - Table view shows all green checkmarks
   - Score based 100% on skills matching
   - Status determined by skill match percentage

2. **Missing Contact Info:**
   - Show "Not Provided" in fields
   - Don't penalize score
   - Add to verification list

3. **No Bonus/Penalty Configured:**
   - Remove from scoring calculation
   - Don't show in detailed scores
   - Redistribute weight proportionally

4. **Zero Questions Provided:**
   - Skip questions section entirely
   - Redistribute 10% weight to other components
   - Don't show in expanded view

### **Priority Calculation Logic:**
```
HIGH: Score >= 80 OR (Score >= 70 AND all mandatory requirements met)
MEDIUM: Score 60-79 with some missing requirements
LOW: Score < 60 OR critical requirements not met
```

### **Flight Risk Assessment:**
```
HIGH: FAANG/top-tier experience OR multiple recent job changes
MEDIUM: Steady employment but marketable skills
LOW: Long tenure OR specialized niche skills
```

### **TypeScript Implementation**

```typescript
interface PromptBuilder {
  role: Role;
  roleSkills: RoleSkill[];
  roleQuestions: RoleQuestion[];
  resumeText: string;
  contactInfo?: ContactInfo;
}

function buildAIPrompt({
  role,
  roleSkills,
  roleQuestions,
  resumeText,
  contactInfo
}: PromptBuilder): string {
  
  const prompt = `
You are an expert HR AI assistant specializing in resume evaluation.
Your task is to evaluate a candidate's resume against a specific job role.
You must provide objective, weighted scoring based on the provided criteria.

JOB ROLE DETAILS:
- Title: ${role.title}
- Description: ${role.description}
- Responsibilities: ${role.responsibilities || 'Not specified'}

EDUCATION REQUIREMENTS:
${role.education_requirements?.hasRequirements 
  ? `Required: ${role.education_requirements.requirements}`
  : 'No specific education requirements'}

EXPERIENCE REQUIREMENTS:
${role.experience_requirements?.hasRequirements
  ? `Required: ${role.experience_requirements.requirements}`
  : 'No specific experience requirements'}

REQUIRED SKILLS TO EVALUATE:
${roleSkills.map((skill, i) => `
${i + 1}. ${skill.skill_name}
   - Category: ${skill.skill_category || 'General'}
   - Weight: ${skill.weight}/10
   - Required: ${skill.is_required ? 'MANDATORY' : 'Optional'}
`).join('')}

${roleSkills.some(s => s.is_required) ? `
IMPORTANT: MANDATORY skills must be present for a passing evaluation.
Missing mandatory skills should significantly reduce the overall score.
` : ''}

EVALUATION QUESTIONS:
${roleQuestions.map((q, i) => `
${i + 1}. ${q.question_text}
   - Category: ${q.category || 'General'}
   - Weight: ${q.weight}/10
`).join('')}

CANDIDATE RESUME:
${resumeText}

${contactInfo ? `
CANDIDATE CONTACT INFO:
- Name: ${contactInfo.name || 'Not found'}
- Email: ${contactInfo.email || 'Not found'}
- Phone: ${contactInfo.phone || 'Not found'}
` : ''}

CRITICAL EVALUATION RULES:

TIER 1 - HARD REQUIREMENTS (Immediate Rejection if Failed):
1. Education: ${role.education_requirements?.hasRequirements ? 'REQUIRED - Must have: ' + role.education_requirements.requirements : 'Not required'}
2. Experience: ${role.experience_requirements?.hasRequirements ? 'REQUIRED - Must have: ' + role.experience_requirements.requirements : 'Not required'}
3. Mandatory Skills: ${roleSkills.filter(s => s.is_required).map(s => s.skill_name).join(', ') || 'None'}

IF ANY REQUIRED ITEM IS MISSING: Set evaluation_status = "REJECTED" and overall_score = 0

TIER 2 - SCORING (Only if Pass Tier 1):
- Education Quality (25%): How well education matches requirements
- Experience Quality (30%): How well experience matches requirements
- Skills Score (25%): Weighted average (MANDATORY skills = 3x weight)
- Questions Score (10%): Weighted average with evidence
- Modifiers (10%): Bonus (0-5%) and Penalties (-5% to 0%)

Proportional Scaling:
Calculate: scale_factor = 100 / (sum of active component weights)
Apply: final_weight = base_weight × scale_factor

Example: No education (0) + Experience (30) + Skills (25) + No questions (0) + No modifiers (0)
= 55 total → scale_factor = 1.82
Final: Experience = 54.5%, Skills = 45.5%

Provide specific evidence quotes for ALL evaluations.

${role.bonus_config ? `
BONUS POINTS RULES:
${JSON.stringify(role.bonus_config, null, 2)}
` : ''}

${role.penalty_config ? `
PENALTY POINTS RULES:
${JSON.stringify(role.penalty_config, null, 2)}
` : ''}

REQUIRED JSON OUTPUT FORMAT:
{
  "candidate_name": "string",
  "overall_score": number,
  "skills_score": number,
  "questions_score": number,
  "bonus_points": number,
  "penalty_points": number,
  "skills_analysis": [...],
  "questions_analysis": [...],
  "recommendations": [...],
  "red_flags": [...],
  "analysis_summary": "string",
  "ai_confidence": number
}

Return ONLY valid JSON. No explanation or additional text.
`;

  return prompt.trim();
}
```

### **Critical Accuracy Factors**

1. **Weight System Precision**
   - 1-10 weight scale for granular importance
   - MANDATORY flag doubles impact (2x multiplier)
   - Weighted average ensures mathematical fairness

2. **Evidence-Based Scoring**
   - AI must quote exact resume text
   - Confidence levels (High/Medium/Low)
   - No assumptions without evidence

3. **Dynamic Adaptation**
   - Handles 1-100+ skills/questions
   - Optional fields handled gracefully
   - Scales with role complexity

4. **Structured Output**
   - Strict JSON for reliable parsing
   - Consistent field names and types
   - Complete analysis in single response

5. **Context Preservation**
   - Full role details included
   - Complete resume text provided
   - Clear scoring methodology

### **Example Output (Senior Full-Stack Developer)**

```
JOB ROLE DETAILS:
- Title: Senior Full-Stack Developer
- Description: Lead our web applications team...
- Responsibilities: Design scalable applications...

REQUIRED SKILLS TO EVALUATE:
1. React.js
   - Category: Frontend
   - Weight: 10/10
   - Required: MANDATORY

2. Node.js
   - Category: Backend
   - Weight: 9/10
   - Required: MANDATORY

3. PostgreSQL
   - Category: Database
   - Weight: 7/10
   - Required: Optional

EVALUATION QUESTIONS:
1. Has the candidate led a development team?
   - Category: Leadership
   - Weight: 8/10

[Full prompt continues with resume and scoring...]
```

### **Refined Scoring Examples**

#### **Example 1: Candidate REJECTED (Missing Education)**
```
Role: Senior Data Scientist
- Education Required: Master's in Data Science/Statistics
- Experience Required: 5+ years
- Mandatory Skills: Python, Machine Learning

Candidate Resume: 10 years experience, all skills present, BUT only Bachelor's degree

Result:
- evaluation_status: "REJECTED"
- overall_score: 0
- rejection_reasons: ["Missing required education: Master's degree"]
```

#### **Example 2: Candidate PASSED (All Requirements Met)**
```
Role: Full-Stack Developer
- Education: Not required
- Experience Required: 3+ years
- Mandatory Skills: React, Node.js
- Optional Skills: PostgreSQL (weight: 7), Docker (weight: 5)

Candidate: 4 years experience, has React, Node.js, PostgreSQL

Scoring:
- Tier 1: PASSED (has experience + mandatory skills)
- Critical Requirements: 95/100 (exceeds 3 years)
- Skills Score: 85/100 (all mandatory + 1 optional)
- Questions Score: 70/100
- Final Score Calculation:
  * Active weights: Experience(30) + Skills(25) + Questions(10) = 65
  * Scale factor: 100/65 = 1.54
  * Final weights: Experience(46.2%), Skills(38.5%), Questions(15.3%)
  * Score: (95*0.462) + (85*0.385) + (70*0.153) = 87.4/100
```

#### **Example 3: Tiebreaker Scenario**
```
Two candidates, both score 82/100 base score

Candidate A:
- Bonus: +3 (industry certifications)
- Penalty: 0
- Final: 85/100

Candidate B:
- Bonus: +1 (relevant project)
- Penalty: -2 (job hopping pattern)
- Final: 81/100

Winner: Candidate A (bonus/penalty made the difference)
```

### **Why This Refined Scoring is Superior**

1. **Respects Hard Requirements**
   - Immediate rejection prevents wasting time on unqualified candidates
   - Aligns with real HR practices

2. **Simple Proportional Scaling**
   - Maintains relative importance ratios
   - Scales active components to total 100%

3. **Clear Decision Factors**
   - Shows exactly why someone passed/failed
   - Provides audit trail for decisions

4. **Handles Edge Cases**
   - Works with 0 skills or 100 skills
   - Functions with or without education/experience requirements
   - Adapts to missing questions or modifiers

5. **Tiebreaker Mechanism**
   - Bonus/penalty system differentiates similar candidates
   - Provides nuanced final ranking

### **Accuracy Guarantees**
✅ **Rejection Accuracy** - Hard requirements enforced first
✅ **Weight Integrity** - Always totals 100% via redistribution
✅ **Evidence Trail** - Every score has supporting quotes
✅ **Dynamic Scaling** - Adapts to any configuration
✅ **Decision Transparency** - Clear factors for every outcome
✅ **Mathematical Precision** - Weighted averages with multipliers
