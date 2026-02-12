import React, { useState, useMemo } from 'react';
import { MapPin, SlidersHorizontal, X } from 'lucide-react';
import Layout from '../components/Layout';
import OpportunityCard from '../components/OpportunityCard';
import { SEED_OPPORTUNITIES, CAUSE_COLORS } from '../lib/seedData';
import './ActionFeed.css';

const ALL_CAUSES = Object.keys(CAUSE_COLORS);

const ActionFeed = () => {
    const [selectedCause, setSelectedCause] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const preferences = JSON.parse(localStorage.getItem('impact_preferences') || '{}');

    const filteredOpps = useMemo(() => {
        let results = SEED_OPPORTUNITIES.filter(o => o.status === 'active');

        if (!selectedCause && preferences.causes && preferences.causes.length > 0) {
            results.sort((a, b) => {
                const aMatch = preferences.causes.includes(a.cause_domain) ? 0 : 1;
                const bMatch = preferences.causes.includes(b.cause_domain) ? 0 : 1;
                return aMatch - bMatch;
            });
        }

        if (selectedCause) {
            results = results.filter(o => o.cause_domain === selectedCause);
        }

        return results;
    }, [selectedCause, preferences.causes]);

    return (
        <Layout>
            {/* Header */}
            <header className="feed-header animate-fade-in">
                <div>
                    <span className="text-eyebrow">Explore</span>
                    <h1 className="feed-title">Discover</h1>
                    {preferences.zipCode && (
                        <p className="feed-location">
                            <MapPin size={13} /> Near {preferences.zipCode}
                        </p>
                    )}
                </div>
                <button
                    className={`feed-filter-btn ${showFilters ? 'feed-filter-btn--active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                >
                    <SlidersHorizontal size={18} />
                </button>
            </header>

            {/* Filters */}
            {showFilters && (
                <div className="feed-filters animate-fade-in">
                    <div className="feed-filters__row">
                        {selectedCause && (
                            <button
                                className="chip feed-chip--clear"
                                onClick={() => setSelectedCause(null)}
                            >
                                Clear <X size={13} />
                            </button>
                        )}
                        {ALL_CAUSES.map(cause => {
                            const color = CAUSE_COLORS[cause];
                            const isActive = selectedCause === cause;
                            return (
                                <button
                                    key={cause}
                                    className={`chip ${isActive ? 'chip--active' : ''}`}
                                    style={isActive ? { background: color.text, borderColor: color.text, color: '#fff' } : {}}
                                    onClick={() => setSelectedCause(isActive ? null : cause)}
                                >
                                    {cause}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Results count */}
            <p className="feed-count animate-fade-in stagger-1">
                {filteredOpps.length} opportunit{filteredOpps.length !== 1 ? 'ies' : 'y'}
            </p>

            {/* Card list */}
            <div className="feed-list">
                {filteredOpps.length > 0 ? (
                    filteredOpps.map((opp, i) => (
                        <OpportunityCard key={opp.id} opportunity={opp} index={i} />
                    ))
                ) : (
                    <div className="feed-empty card-warm animate-scale-in">
                        <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 4 }}>No matches found</p>
                        <p className="text-muted text-sm">Try a different filter or check back soon.</p>
                        <button
                            className="btn btn-outline"
                            style={{ marginTop: 'var(--space-4)' }}
                            onClick={() => setSelectedCause(null)}
                        >
                            Show all
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ActionFeed;
