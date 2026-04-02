import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, SlidersHorizontal, X, Search, PlusCircle, LayoutDashboard } from 'lucide-react';
import Layout from '../components/Layout';
import OpportunityCard from '../components/OpportunityCard';
import { fetchOpportunities, checkSupabaseRawFetch, fetchOpportunitiesRaw } from '../lib/supabase';
import { SEED_OPPORTUNITIES, CAUSE_COLORS } from '../lib/seedData';
import { useAuth } from '../context/useAuth';
import './ActionFeed.css';

const ALL_CAUSES = Object.keys(CAUSE_COLORS);
const PAGE_SIZE = 12;

const ActionFeed = () => {
    const { isOrganizer } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCause, setSelectedCauseRaw] = useState(searchParams.get('cause') || null);
    const [showFilters, setShowFilters] = useState(!!searchParams.get('cause'));
    const [searchQuery, setSearchQueryRaw] = useState(searchParams.get('q') || '');
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [usingSeed, setUsingSeed] = useState(false);
    const [errorState, setErrorState] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const preferences = JSON.parse(localStorage.getItem('impact_preferences') || '{}');

    const syncParams = useCallback((cause, q) => {
        const params = new URLSearchParams();
        if (cause) params.set('cause', cause);
        if (q) params.set('q', q);
        setSearchParams(params, { replace: true });
    }, [setSearchParams]);

    const setSelectedCause = (cause) => {
        setSelectedCauseRaw(cause);
        syncParams(cause, searchQuery);
    };

    const setSearchQuery = (q) => {
        setSearchQueryRaw(q);
        syncParams(selectedCause, q);
    };

    const loadOpportunities = useCallback(async ({ offset = 0, append = false } = {}) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setErrorState(false);
            setUsingSeed(false);
        }

        // Try RAW FETCH diagnostic first
        const rawHealth = await checkSupabaseRawFetch();
        console.log('Raw Fetch Connectivity Check:', rawHealth.ok ? 'SUCCESS' : 'FAILED', rawHealth.error || '');

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out after 10s')), 10000)
            );

            const getOpportunities = async () => {
                if (rawHealth.ok) {
                    console.log('ActionFeed: Using RAW FETCH');
                    return await fetchOpportunitiesRaw({ offset, limit: PAGE_SIZE });
                }
                console.log('ActionFeed: Using standard Supabase-JS');
                return await fetchOpportunities({ offset, limit: PAGE_SIZE });
            };

            const result = await Promise.race([
                getOpportunities(),
                timeoutPromise
            ]);

            const items = result?.items || [];
            if (items.length) {
                setOpportunities((prev) => append ? [...prev, ...items] : items);
                setHasMore(Boolean(result?.hasMore));
                setNextOffset(result?.nextOffset ?? (offset + items.length));
            } else if (!append) {
                console.log('ActionFeed: No results from DB, using seeds.');
                setOpportunities(SEED_OPPORTUNITIES);
                setUsingSeed(true);
                setHasMore(false);
                setNextOffset(0);
            }
        } catch (e) {
            console.error('ActionFeed ERROR:', e.message || e);
            if (!append) {
                setErrorState(true);
                setOpportunities(SEED_OPPORTUNITIES);
                setUsingSeed(true);
                setHasMore(false);
                setNextOffset(0);
            }
        } finally {
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await new Promise(r => setTimeout(r, 100));
            if (cancelled) return;
            await loadOpportunities({ offset: 0, append: false });
        })();
        return () => { cancelled = true; };
    }, [loadOpportunities]);

    const filteredOpps = useMemo(() => {
        let results = opportunities.filter(o => o.status === 'active');

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            results = results.filter(o =>
                o.title?.toLowerCase().includes(q) ||
                o.description?.toLowerCase().includes(q) ||
                o.organizer_name?.toLowerCase().includes(q) ||
                o.location_address?.toLowerCase().includes(q)
            );
        }

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
    }, [selectedCause, searchQuery, preferences.causes, opportunities]);

    const feedTitle = isOrganizer ? 'Marketplace Preview' : 'Discover';
    const feedEyebrow = isOrganizer ? 'Organizer View' : 'Explore';
    const searchPlaceholder = isOrganizer
        ? 'Search live listings by title, cause, or location...'
        : 'Search events, organizers, locations...';
    const resultsLabel = loading
        ? 'Loading...'
        : isOrganizer
            ? `${filteredOpps.length} public listing${filteredOpps.length !== 1 ? 's' : ''}`
            : `${filteredOpps.length} opportunit${filteredOpps.length !== 1 ? 'ies' : 'y'}`;

    return (
        <Layout>
            {/* Header */}
            <header className="feed-header animate-fade-in">
                <div>
                    <span className="text-eyebrow">{feedEyebrow}</span>
                    <h1 className="feed-title">{feedTitle}</h1>
                    <p className="feed-subtitle">
                        {isOrganizer
                            ? 'This is the volunteer-facing marketplace. Use it to preview how active opportunities will appear to potential volunteers.'
                            : 'Browse volunteer opportunities across Barcelona and find the causes that fit you best.'}
                    </p>
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

            {isOrganizer && (
                <section className="feed-quick-actions card-elevated animate-fade-in stagger-1">
                    <div>
                        <span className="text-eyebrow">Organizer Actions</span>
                        <h2 className="feed-quick-actions__title">Manage your supply, then preview the public experience</h2>
                        <p className="text-sm text-muted">
                            Create events and monitor signups from your dashboard, then use this page to sanity-check search, filters, and card presentation.
                        </p>
                    </div>
                    <div className="feed-quick-actions__buttons">
                        <Link to="/dashboard/organizer" className="btn btn-primary">
                            <LayoutDashboard size={16} /> Organizer dashboard
                        </Link>
                        <Link to="/dashboard/organizer" className="btn btn-outline">
                            <PlusCircle size={16} /> Create new event
                        </Link>
                    </div>
                </section>
            )}

            {/* Search */}
            <div className="feed-search animate-fade-in stagger-1">
                <Search size={16} className="feed-search__icon" />
                <input
                    type="text"
                    className="input feed-search__input"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="feed-search__clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

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

            {/* Sample data notice */}
            {usingSeed && (
                <div className="feed-seed-notice card-warm animate-fade-in stagger-1">
                    <p className="text-sm text-muted">
                        {isOrganizer
                            ? 'Showing sample opportunities so you can preview the marketplace layout while live data is unavailable.'
                            : 'Showing sample opportunities. Live events will appear once the platform launches.'}
                    </p>
                </div>
            )}

            {/* Results count */}
            <p className="feed-count animate-fade-in stagger-1" aria-live="polite">
                {resultsLabel}
            </p>

            {/* Card list */}
            <div className="feed-list">
                {loading ? (
                    <div className="feed-empty card-warm animate-scale-in">
                        <div className="detail-spinner" style={{ margin: '0 auto var(--space-3)' }} />
                        <p className="text-muted text-sm">Consulting the compass...</p>
                    </div>
                ) : errorState && !opportunities.length ? (
                    <div className="feed-empty card-warm animate-scale-in">
                        <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 4 }}>Connection issue</p>
                        <p className="text-muted text-sm">We're having trouble reaching the impact database. Your project might be paused or slow to respond.</p>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Try again
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => { setErrorState(false); setUsingSeed(true); setOpportunities(SEED_OPPORTUNITIES); }}
                            >
                                Use sample data
                            </button>
                        </div>
                    </div>
                ) : filteredOpps.length > 0 ? (
                    <>
                        {filteredOpps.map((opp, i) => (
                            <OpportunityCard
                                key={opp.id}
                                opportunity={opp}
                                index={i}
                                mode={isOrganizer ? 'organizer' : 'volunteer'}
                            />
                        ))}
                    </>
                ) : (
                    <div className="feed-empty card-warm animate-scale-in">
                        <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 4 }}>
                            {isOrganizer ? 'No public listings match these filters' : 'No matches found'}
                        </p>
                        <p className="text-muted text-sm">
                            {isOrganizer
                                ? 'Try a different search or create a new event from your organizer dashboard.'
                                : 'Try a different filter or check back soon.'}
                        </p>
                        <button
                            className="btn btn-outline"
                            style={{ marginTop: 'var(--space-4)' }}
                            onClick={() => { setSelectedCause(null); setSearchQuery(''); }}
                        >
                            Show all
                        </button>
                    </div>
                )}
            </div>

            {!usingSeed && hasMore && !loading && (
                <div className="feed-load-more animate-fade-in">
                    <button
                        className="btn btn-outline"
                        onClick={() => loadOpportunities({ offset: nextOffset, append: true })}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading more...' : 'Load more opportunities'}
                    </button>
                </div>
            )}
        </Layout>
    );
};

export default ActionFeed;
