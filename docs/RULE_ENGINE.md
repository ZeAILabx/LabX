# LABX — Rule Engine Specification

The LABX Rule Engine executes deterministic business rules server-side on Flask. No AI/LLMs are used for scoring or progression.

---

## 1. Founder Assessment Rules

### Domain Calculation
Q1 selection directly maps to 1 of 12 Domains.

### Stage Calculation
- **Primary Signal**: Q2 response maps to initial stage.
- **Cross-Check**: Q3 evidence selections cross-check Q2. If evidence items indicate a lower stage than claimed in Q2, the conservative evidence stage is assigned.

### Level Calculation
1. **Raw Level Score**:
   $$\text{Level Score} = \frac{Q_4 + Q_5 + Q_6 + Q_7}{4}$$
2. **Score Mapping**:
   - `1.00 – 1.49` -> Level 1
   - `1.50 – 2.49` -> Level 2
   - `2.50 – 3.49` -> Level 3
   - `3.50 – 4.49` -> Level 4
   - `4.50 – 5.00` -> Level 5
3. **Stage Ceiling**:
   - `Discover` -> Maximum Level 3
   - `Validate` -> Maximum Level 3
   - `Build` -> Maximum Level 4
   - `Launch` -> Maximum Level 5
   - `Grow` -> Maximum Level 5

$$\text{Final Level} = \min(\text{Calculated Level}, \text{Stage Ceiling})$$

---

## 2. Progression Cascade Rules

1. **Milestone Completion**: A milestone is completed ONLY when ALL mandatory Core Quests belonging to that milestone are approved by Admin or verified. Side Quests do NOT block progression.
2. **Milestone Unlocking**: Completing Milestone 1 unlocks Milestone 2 in sequence.
3. **Level Progression**: Completing all 3 Milestones in Level $N$ unlocks Level $N+1$.
4. **Stage Progression**: Completing Level 5 in Stage $S$ completes Stage $S$ and unlocks Stage $S+1$ Level 1.
5. **LABX Points**: Awarded upon quest approval. Prevented from double-dipping via `points_transactions` database unique constraint. Points do NOT drive level progression. Progression is driven solely by Core Quest milestone completion.
