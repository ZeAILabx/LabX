import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, ChevronRight, Rocket, Shield } from 'lucide-react';

const DOMAIN_OPTIONS = [
  "Artificial Intelligence & Machine Learning",
  "Healthcare & MedTech",
  "Smart Education",
  "Women Safety & Social Impact",
  "Cybersecurity",
  "FinTech & Digital Economy",
  "Smart Mobility & Logistics",
  "Sustainability",
  "Agriculture & Food Technology",
  "Smart Cities & Infrastructure",
  "Media, Entertainment & Creator Technology",
  "Space, Robotics & Advanced Technology",
];

const STAGE_OPTIONS = [
  "I have only identified a problem",
  "I have an idea/concept",
  "I have researched the problem and potential users",
  "I have validated the problem with real users",
  "I have built a prototype/MVP",
  "I have launched the product",
  "I have active users",
  "I have paying customers/revenue",
  "I am actively scaling the product",
];

const EVIDENCE_OPTIONS = [
  { key: 'problem_statement', label: 'Problem statement documented' },
  { key: 'user_interviews', label: 'User interviews completed' },
  { key: 'market_research', label: 'Market/competitor research completed' },
  { key: 'customer_validation', label: 'Customer/user validation' },
  { key: 'prototype', label: 'Prototype' },
  { key: 'working_mvp', label: 'Working MVP' },
  { key: 'live_product', label: 'Live product' },
  { key: 'active_users', label: 'Active users' },
  { key: 'paying_customers', label: 'Paying customers' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'none_yet', label: 'None yet' },
];

const EXECUTION_OPTIONS = [
  "I need step-by-step guidance",
  "I can do basic tasks with help",
  "I can complete most tasks independently",
  "I can handle complex tasks independently",
  "I can lead execution and make technical/product decisions",
];

const VALIDATION_OPTIONS = [
  "None yet",
  "Talked to potential users",
  "Users have tested my solution",
  "Regular active users",
  "Paying customers",
  "Consistent revenue/growth",
];

const MATURITY_OPTIONS = [
  "No product yet",
  "Concept/wireframe",
  "Prototype/demo",
  "Partially working product",
  "Working MVP",
  "Production-ready product",
  "Production product being continuously improved with real users",
];

const COMPLETED_OPTIONS = [
  "Only identified the problem",
  "Researched the problem and users",
  "Validated problem/solution with real users",
  "Built a prototype",
  "Built a working MVP",
  "Launched a working product",
  "Have active users",
  "Have paying customers/revenue",
  "Actively scaling",
];

export const AssessmentWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    q1: null,
    q2: null,
    q3: [],
    q4: null,
    q5: null,
    q6: null,
    q7: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();

  const handleSingleSelect = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleMultiSelect = (key) => {
    setAnswers((prev) => {
      const current = prev.q3;
      if (key === 'none_yet') {
        return { ...prev, q3: ['none_yet'] };
      }
      const filtered = current.filter((k) => k !== 'none_yet');
      const exists = filtered.includes(key);
      const next = exists ? filtered.filter((k) => k !== key) : [...filtered, key];
      return { ...prev, q3: next.length ? next : ['none_yet'] };
    });
  };

  const handleNext = () => {
    if (step === 1 && !answers.q1) return setError('Please select a domain');
    if (step === 2 && !answers.q2) return setError('Please select project stage');
    if (step === 4 && !answers.q4) return setError('Please select execution capability');
    if (step === 5 && !answers.q5) return setError('Please select validation level');
    if (step === 6 && !answers.q6) return setError('Please select product maturity');
    if (step === 7 && !answers.q7) return setError('Please select completed work');

    setError('');
    if (step < 7) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.submitAssessment(answers);
      await refreshUser();
      if (onComplete) {
        onComplete(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto' }}>
      {/* Step Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
          Founder Diagnostic Assessment
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Step {step} of 7 — One-time evaluation to determine your starting Domain, Stage & Level
        </p>

        {/* Progress Bar */}
        <div className="progress-bar-bg" style={{ marginTop: '16px', height: '6px' }}>
          <div className="progress-bar-fill" style={{ width: `${(step / 7) * 100}%` }} />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* QUESTION 1 — DOMAIN */}
        {step === 1 && (
          <QuestionStep
            title="What problem domain are you working on?"
            subtitle="This directly determines your Domain and automatic Guild assignment."
          >
            {DOMAIN_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q1 === idx + 1}
                onClick={() => handleSingleSelect('q1', idx + 1)}
                label={opt}
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 2 — PROJECT STAGE */}
        {step === 2 && (
          <QuestionStep
            title="What best describes the current state of your project?"
            subtitle="Select the primary state of development."
          >
            {STAGE_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q2 === idx + 1}
                onClick={() => handleSingleSelect('q2', idx + 1)}
                label={opt}
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 3 — EVIDENCE */}
        {step === 3 && (
          <QuestionStep
            title="What evidence do you currently have?"
            subtitle="Select all evidence items that apply to your venture."
          >
            {EVIDENCE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.q3.includes(opt.key)}
                onClick={() => handleMultiSelect(opt.key)}
                label={opt.label}
                multi
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 4 — EXECUTION */}
        {step === 4 && (
          <QuestionStep
            title="How independently can you execute your project work?"
            subtitle="Assesses execution confidence and skill maturity."
          >
            {EXECUTION_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q4 === idx + 1}
                onClick={() => handleSingleSelect('q4', idx + 1)}
                label={`${idx + 1}. ${opt}`}
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 5 — VALIDATION / TRACTION */}
        {step === 5 && (
          <QuestionStep
            title="How much real-world validation or traction do you have?"
            subtitle="Assesses customer signal and market response."
          >
            {VALIDATION_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q5 === idx + 1}
                onClick={() => handleSingleSelect('q5', idx + 1)}
                label={opt}
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 6 — PRODUCT MATURITY */}
        {step === 6 && (
          <QuestionStep
            title="How complete and reliable is your current product?"
            subtitle="Assesses technical and product readiness."
          >
            {MATURITY_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q6 === idx + 1}
                onClick={() => handleSingleSelect('q6', idx + 1)}
                label={opt}
              />
            ))}
          </QuestionStep>
        )}

        {/* QUESTION 7 — COMPLETED WORK */}
        {step === 7 && (
          <QuestionStep
            title="What have you actually completed to date?"
            subtitle="Final verification of tangible outputs achieved."
          >
            {COMPLETED_OPTIONS.map((opt, idx) => (
              <OptionCard
                key={opt}
                selected={answers.q7 === idx + 1}
                onClick={() => handleSingleSelect('q7', idx + 1)}
                label={opt}
              />
            ))}
          </QuestionStep>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          {step > 1 ? (
            <button
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
            >
              Back
            </button>
          ) : <div />}

          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? 'Calculating Result...' : step === 7 ? 'Complete Diagnostic' : 'Next Step'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionStep = ({ title, subtitle, children }) => (
  <div>
    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px', color: '#fff' }}>
      {title}
    </h2>
    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
      {subtitle}
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {children}
    </div>
  </div>
);

const OptionCard = ({ selected, onClick, label, multi }) => (
  <div
    onClick={onClick}
    style={{
      padding: '14px 18px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: selected ? 'var(--primary-light)' : 'rgba(255,255,255,0.03)',
      border: selected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
      color: selected ? '#fff' : 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    <span style={{ fontWeight: selected ? '600' : '400', fontSize: '0.95rem' }}>{label}</span>
    {selected && <CheckCircle2 size={20} color="var(--primary)" />}
  </div>
);
