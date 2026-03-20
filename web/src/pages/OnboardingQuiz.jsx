import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import { submitOnboardingPreferences } from '../lib/supabase';
import { checkSubmissionRate, markSubmission } from '../lib/antiAbuse';
import './OnboardingQuiz.css';

const CAUSES = [
    'Climate Action', 'Social Justice', 'Education', 'Animal Welfare',
    'Health & Wellbeing', 'Community Building', 'Arts & Culture', 'Poverty Alleviation'
];

const CAUSE_EMOJI = {
    'Climate Action': '🌱',
    'Social Justice': '⚖️',
    'Education': '📚',
    'Animal Welfare': '🐾',
    'Health & Wellbeing': '💛',
    'Community Building': '🏘️',
    'Arts & Culture': '🎨',
    'Poverty Alleviation': '🤝'
};

const SKILLS = [
    'Manual Labor', 'Teaching / Mentoring', 'Event Planning', 'Tech / Digital',
    'Social Media', 'Fundraising', 'Cooking / Food Prep', 'General Help'
];

const SKILL_EMOJI = {
    'Manual Labor': '🔨',
    'Teaching / Mentoring': '🧑‍🏫',
    'Event Planning': '📋',
    'Tech / Digital': '💻',
    'Social Media': '📱',
    'Fundraising': '💰',
    'Cooking / Food Prep': '🍳',
    'General Help': '🙌'
};

const OnboardingQuiz = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        causes: [],
        skills: [],
        zipCode: '',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [website, setWebsite] = useState('');
    const [submitNotice, setSubmitNotice] = useState('');

    const toggleSelection = (field, value) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (website.trim()) {
            navigate('/feed');
            return;
        }
        const rate = checkSubmissionRate('onboarding', { minIntervalMs: 10000, maxPerHour: 8 });
        if (rate.blocked) {
            setSubmitNotice('You are submitting too quickly. Please wait a few seconds and try again.');
            return;
        }
        setSubmitNotice('');
        setIsSubmitting(true);
        markSubmission('onboarding');

        try {
            localStorage.setItem('impact_preferences', JSON.stringify(formData));

            await submitOnboardingPreferences({
                zipCode: formData.zipCode,
                causes: formData.causes,
                skills: formData.skills,
                email: formData.email,
            });
            navigate('/feed');
        } catch (error) {
            console.error('Onboarding error:', error);
            navigate('/feed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const STEP_DATA = {
        1: {
            title: 'What speaks to your heart?',
            subtitle: 'Pick the causes that move you. You can always change these later.',
            eyebrow: 'Your Passions'
        },
        2: {
            title: 'How do you like to help?',
            subtitle: 'Select your strengths — we\'ll match you with the right roles.',
            eyebrow: 'Your Skills'
        },
        3: {
            title: 'Where can we find you?',
            subtitle: 'So we can surface opportunities within reach.',
            eyebrow: 'Your Location'
        }
    };

    const currentStep = STEP_DATA[step];

    return (
        <Layout>
            {/* Progress */}
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* Header */}
            <header className="onboard-header">
                <div className="onboard-header__left">
                    {step > 1 && (
                        <button onClick={handleBack} className="onboard-back" aria-label="Go back">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                </div>
                <span className="text-eyebrow">{step} of 3</span>
                <div className="onboard-header__right" />
            </header>

            {/* Content */}
            <main className="onboard-content" key={step}>
                <div className="onboard-intro animate-fade-in">
                    <span className="text-eyebrow text-accent">{currentStep.eyebrow}</span>
                    <h1 className="onboard-title">{currentStep.title}</h1>
                    <p className="onboard-subtitle">{currentStep.subtitle}</p>
                </div>

                {step === 1 && (
                    <div className="onboard-grid animate-fade-in stagger-2">
                        {CAUSES.map((cause, i) => {
                            const isActive = formData.causes.includes(cause);
                            return (
                                <button
                                    key={cause}
                                    onClick={() => toggleSelection('causes', cause)}
                                    className={`chip ${isActive ? 'chip--active' : ''}`}
                                    style={{ animationDelay: `${0.08 + i * 0.04}s` }}
                                >
                                    <span className="chip__emoji">{CAUSE_EMOJI[cause]}</span>
                                    {cause}
                                    {isActive && <Check size={14} strokeWidth={3} />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {step === 2 && (
                    <div className="onboard-grid animate-fade-in stagger-2">
                        {SKILLS.map((skill, i) => {
                            const isActive = formData.skills.includes(skill);
                            return (
                                <button
                                    key={skill}
                                    onClick={() => toggleSelection('skills', skill)}
                                    className={`chip ${isActive ? 'chip--active' : ''}`}
                                    style={{ animationDelay: `${0.08 + i * 0.04}s` }}
                                >
                                    <span className="chip__emoji">{SKILL_EMOJI[skill]}</span>
                                    {skill}
                                    {isActive && <Check size={14} strokeWidth={3} />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="onboard-form animate-fade-in stagger-2">
                        <div className="onboard-field">
                            <label className="onboard-label">Zip / Postal Code</label>
                            <div className="onboard-input-wrap">
                                <MapPin size={16} className="onboard-input-icon" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 08001"
                                    className="input"
                                    style={{ paddingLeft: 40 }}
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="onboard-field">
                            <label className="onboard-label">
                                Email <span className="text-soft">(optional)</span>
                            </label>
                            <input
                                type="email"
                                placeholder="For activity reminders"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <input
                            type="text"
                            className="hp-field"
                            tabIndex="-1"
                            autoComplete="off"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            aria-hidden="true"
                        />
                        {submitNotice && (
                            <p className="text-sm text-muted">{submitNotice}</p>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary onboard-submit"
                            disabled={isSubmitting || !formData.zipCode}
                        >
                            {isSubmitting ? (
                                <span className="landing-spinner" />
                            ) : (
                                <>Find Opportunities <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>
                )}
            </main>

            {/* Footer nav — only for steps 1 & 2 */}
            {step < 3 && (
                <footer className="onboard-footer">
                    <button
                        onClick={handleNext}
                        className="btn btn-ghost"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                        disabled={step === 1 && formData.causes.length === 0}
                    >
                        Continue <ArrowRight size={16} />
                    </button>
                </footer>
            )}
        </Layout>
    );
};

export default OnboardingQuiz;
