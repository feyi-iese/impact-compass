import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import {
    submitOnboardingPreferences,
    sendMagicLink,
    upsertMyProfile,
} from '../lib/supabase';
import { useAuth } from '../context/useAuth';
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
    const { user, profile, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        displayName: '',
        causes: [],
        skills: [],
        zipCode: '',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [website, setWebsite] = useState('');
    const [submitNotice, setSubmitNotice] = useState('');

    useEffect(() => {
        if (!user || !profile) return;
        setFormData((prev) => ({
            ...prev,
            displayName: prev.displayName || profile.display_name || '',
            causes: prev.causes.length ? prev.causes : (profile.causes || []),
            skills: prev.skills.length ? prev.skills : (profile.skills || []),
            zipCode: prev.zipCode || profile.zip_code || '',
            email: prev.email || user.email || '',
        }));
    }, [profile, user]);

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

        // Validate zip code
        const isZipValid = /^\d{5}$/.test(formData.zipCode);
        if (!isZipValid) {
            setSubmitNotice('Please enter a valid 5-digit zip code.');
            return;
        }

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
            localStorage.setItem('pending_onboarding', JSON.stringify(formData));

            if (user) {
                console.log('Saving profile for authenticated user:', user.id);
                await upsertMyProfile({
                    display_name: formData.displayName.trim() || null,
                    zip_code: formData.zipCode,
                    causes: formData.causes,
                    skills: formData.skills,
                    onboarding_completed: true,
                });
                await refreshProfile();
                navigate('/dashboard/volunteer');
                return;
            }

            if (!formData.email) {
                setSubmitNotice('Add an email so we can create your account with a magic link.');
                return;
            }

            localStorage.setItem('pending_role', 'volunteer');
            await sendMagicLink({ email: formData.email });

            await submitOnboardingPreferences({
                zipCode: formData.zipCode,
                causes: formData.causes,
                skills: formData.skills,
                email: formData.email,
            });
            navigate('/auth');
        } catch (error) {
            console.error('Onboarding error:', error);
            setSubmitNotice(
                `Could not send magic link. ${error?.message || 'Please check your Supabase auth settings and try again.'}`
            );
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
        <Layout backTo={step > 1 ? undefined : '/'} backLabel="Back to home">
            {/* Progress */}
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* Step header */}
            <header className="onboard-header">
                <div className="onboard-header__left">
                    {step > 1 && (
                        <button onClick={handleBack} className="onboard-back" aria-label="Go to previous step">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
                            <label className="onboard-label">Your name</label>
                            <input
                                type="text"
                                placeholder="e.g. Alex Johnson"
                                className="input"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                        </div>

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
                                Email <span className="text-soft">(required to create your account)</span>
                            </label>
                            <input
                                type="email"
                                placeholder="For your magic-link sign in"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required={!user}
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
                        {!user && (
                            <p className="text-xs text-muted">
                                Already have a link? <Link to="/auth">Sign in here</Link>.
                            </p>
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
