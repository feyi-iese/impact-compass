# Impact Compass — PRD (MVP for New Ventures Pilot)

### TL;DR

Despite high levels of social and environmental concern among urban young adults in Europe, there remains a persistent gap between intent and meaningful action. Impact Compass is a mobile platform concept that closes this gap by making scheduled volunteering opportunities and events easy to discover and commit to.

For the New Ventures class (1-month scope, limited team bandwidth), this PRD focuses on a validation prototype that measures intent-to-commitment behavior (onboarding → curated opportunities → RSVP intent) and validates NGO coordination pain through interviews—rather than running a full operational pilot.

---

## Goals

### Business Goals

* Validate the venture-critical assumptions via \~9–13 total interviews (6–8 target users; 3–5 NGOs/organizers) and synthesize findings into a clear go/no-go recommendation.

* Build and test a lightweight, instrumented prototype that supports the core loop: onboarding → curated scheduled opportunities → opportunity detail → RSVP intent.

* Generate early demand signal via 25–40 waitlist signups (landing page or equivalent) and measure conversion into prototype usage.

* Observe at least 10–15 onboarding completions and 8–12 RSVP-intent events within the prototype to quantify intent-to-commitment behavior.

* Produce a concrete post-class execution plan: what must be true to run a real attendance-based pilot, partnership approach, and the smallest next build.

### User Goals

* Make it easy and motivating to discover and participate in local social and environmental actions matching personal interests.

* Reduce friction from intent to action with a guided, transparent, and supportive journey—including reminders and feedback.

* Build trust in organizations and opportunities through robust information, transparency cues, and post-engagement feedback.

* Enable lightweight community: share actions, invite friends, and see collective impact.

* Access credible, curated educational content to deepen knowledge and confidence.

### Non-Goals

* Building a fully open social network or forum—the MVP limits social features to sharing actions and simple invitations.

* Full support for complex multi-day events, flexible/ongoing volunteering, or intricate volunteer logistics.

* A full operational pilot that requires NGO partners to confirm attendance at scale (this comes after New Ventures, once supply is secured).

* Comprehensive donation/payment functionality or nonprofit vetting/ratings (not included at MVP stage).

---

## User Stories

### Ana (Purpose-Seeking Professional)

* As an urban professional who cares about climate and social justice, I want to quickly get personalized action recommendations so that I don’t waste time searching and can fit meaningful activities into my busy routine.

* As a new user, I want an onboarding quiz that feels quick and relevant, so that the app understands my values and skills.

* As someone a bit hesitant, I want to see transparent info about each opportunity (what’s expected, who else is coming), so that I can trust my first experience.

* As a participant, I want to receive reminders and quick post-activity feedback so that I know my action mattered and feel motivated to continue.

### Luis (Curious Activist)

* As someone looking for new ways to help, I want a curated, location-based feed so that I discover both familiar and new types of impact opportunities.

* As a connector, I want to easily invite friends to join actions with me, so that I feel supported and can make social impact a shared experience.

* As a returning user, I want an easy way to review my past actions and see my impact history.

### NGO Coordinator/Admin

* As an NGO event coordinator, I want a simple portal to post, edit, and manage opportunities so that I can attract motivated, relevant participants.

* As an admin, I want to see real-time attendee lists and communicate key updates to volunteers.

* As an organizer, I want a follow-up channel to thank, update, or survey participants after the event.

### CSR Manager (Future/Out-of-Scope for MVP)

* As a CSR leader, I want to coordinate group volunteering, track employee participation, and report impact for my company.

---

## Functional Requirements

* **Onboarding & Personalization (Priority: P0)**

  * Onboarding Quiz: Three-step flow to identify user’s values, interests, and location.

  * Profile Set-Up: Collect minimum info (email/phone, notification opt-in).

* **Action Feed & Discovery (Priority: P0)**

  * Curated Feed: Personalized, geo-targeted list of scheduled opportunities (volunteering shifts and events) with fixed date/time.

  * Filters: By domain (e.g., environment, social), day/time window, and distance. (Keep minimal to reduce build and cognitive load.)

* **Opportunity Detail & RSVP-Intent Flow (Priority: P0)**

  * Detail Screen: Opportunity summary, requirements, organizer info, and transparency cues.

  * RSVP Intent CTA: One-tap “Request to join / I’m interested” (instrumented). For the class prototype, confirmation can be simulated (e.g., thank-you screen + optional email capture).

  * Optional Calendar Add: Allow users to add the event to their calendar if date/time is fixed.

* **Social Engagement (Priority: P1)**

  * Invite-a-Friend: Easy share via messaging/social apps or direct invite.

  * Group RSVP: Tag/join with friends (basic functionality).

* **Reminders & Nudge Experiments (Priority: P0)**

  * Scheduled Notifications: Pre-action reminders, day-of and post-activity prompts.

  * A/B Testable Nudges: Test variants of reminder timing/text.

* **Feedback & Impact Loop (Priority: P1)**

  * Post-Activity Feedback Form: Quick survey and “how did it feel” replay.

  * Impact Summary: Visual indicator of participation and collective outcomes.

* **Content & Learning Hub (Priority: P1)**

  * Curated Articles/FAQs: Short, engaging content pieces around causes and opportunities.

  * Opportunity FAQ Access: Linked from detail view.

* **Profile/History/Tracking (Priority: P2)**

  * Basic Action Log: Past RSVPs and completed actions.

  * Impact Tracker: Simple count or badge (MVP level).

* **Organizer Intake (Priority: P1)**

  * Opportunity Submission Form: Lightweight form (e.g., Airtable/Google Form) for organizers to submit scheduled opportunities (title, date/time, location, capacity, description, requirements, contact).

  * Curation Queue: Internal review step to ensure clarity and reduce misinformation.

  * (Deferred) Full NGO portal for attendee management and messaging.

* **Moderation & Trust (Priority: P1)**

  * NGO Verification: Visual signals for verified orgs.

  * Flag/Report Tool: Users can report misleading or inappropriate postings.

* **Analytics Instrumentation (Priority: P0)**

  * Core user actions, drop-offs, A/B nudge test metrics.

---

## User Experience

**Entry Point & First-Time User Experience**

* Users arrive via mobile web or app link, social referral, or NGO partner promotion.

* Onboarding opens with a friendly, tightly-scoped 3-question flow: covering cause preference, skill/interests, and zip/postal code.

* Minimal data asked up front. Users can skip but are encouraged to personalize.

* Optional opt-in to notifications and email for reminders.

**Core Experience**

* **Step 1:** User lands on action feed, showing curated nearby scheduled opportunities with key info (title, cause, date/time, duration, distance, organizer).

  * Clean, distraction-free UI.

  * Intelligent limited choices to avoid overload (max 5–7 primary options).

  * Empty state: widen distance/time filters, join waitlist, or request notifications when new opportunities are added.

* **Step 2:** User taps on opportunity to view full details—description, map (if offline), requirements, safety info, FAQ, transparent contact.

  * Clear “Sign Up” or “Save” CTA.

  * “Invite friend” prominently displayed.

* **Step 3:** On sign-up, user receives confirmation, option to add to calendar, and preview of what to expect next (reminder, feedback).

* **Step 4:** Leading up to the event, user is nudged with reminders personalized based on prior engagement style (“gentle nudge” vs. “firm confirm”).

* **Step 5:** After completion, quick feedback/review flow; visual impact summary.

* **Step 6:** User prompted to explore content hub or new opportunities.

* **Step 7:** For inviting friends, a fast selection/sharing flow—track who joined via invite.

**Advanced Features & Edge Cases**

* If no opportunities are available nearby, app encourages the user to widen their distance/time filters or join a waitlist for upcoming opportunities.

* Cancellations or NGO changes trigger automatic user notifications.

* No-show, NGO unresponsive, or negative experience triggers optional feedback or escalation flow.

* Social visibility is opt-in per action—user controls privacy.

* Overload protection: never more than 7 default recommendations; periodic refresh based on activity.

**UI/UX Highlights**

* Low cognitive load: progressive disclosure and clear, plain-language summaries.

* Strong design contrast, fast load, large tap targets for accessibility.

* “Trust signals” (e.g., badges, clear data sources, up-front requirements) throughout.

* Fully responsive for mobile, adjustable font and color settings.

---

## Narrative

Ana, a 27-year-old professional living in a vibrant European city, has been seeking ways to make her values visible in her actions. Work and social obligations leave her well-intentioned but overwhelmed: she eagerly shares petitions online but rarely follows up, unsure where to start or who to trust. On the subway, Ana sees a link to Impact Compass, promising to bridge that gap—turning concern into action in minutes.

With just a few taps, Ana completes a friendly onboarding quiz highlighting her passions (climate, social inclusion, animal welfare) and her neighborhood. Instantly, her feed displays nearby weekend opportunities—tree-planting, a skills workshop for refugees, an ethical shopping guide. Each has transparent details: who is leading, what to expect, and the impact achieved by past volunteers. She picks one, invites her friend Luis, and feels at ease with confirmations and a map to the venue.

Reminders keep her on track without feeling intrusive. Post-event, a quick check-in lets her reflect on the experience and see a growing tally of her contributions—she’s even thanked by the NGO directly. Weeks later, Ana finds herself returning to the app, this time proactively searching the content hub for ways to drive change at home and at work. What started as a curiosity is now a genuine, ongoing journey. The app’s friction-light, trustworthy guidance and simple social touchpoints have finally closed the intention-action gap, to the benefit of Ana— and her community.

---

## Success Metrics

### User-Centric Metrics

* **Activation:** % of users who complete onboarding and save/sign up for their first action (target: >50%).

* **First Action Conversion Rate:** % of new signups taking one action within 7 days.

* **Show-Up Rate:** % of RSVPs who actually attend (confirmed via NGO check-in and/or volunteer self-check-in + optional geo/time validation).

* **Repeat Engagement:** % of active users taking a second action within 30 days.

* **Content Engagement:** Number of content views or shares per user session.

* **Trust/Transparency:** Report rate (flags per opportunity), positive feedback rate, NPS (net promoter score).

### Business Metrics

* **Pilot Partner Adoption:** Number of NGOs actively posting and managing opportunities (2–3 minimum in pilot).

* **Activation Funnel:** Drop-off rates at onboarding, feed, signup, and confirmation.

* **Post-SEE Roadmap Input:** Qualitative user/partner interviews analyzed, leading to at least 3 validated monetization hypotheses.

### Technical Metrics

* **System Uptime:** >99% uptime during scheduled events.

* **Notification Delivery Success:** >95% for reminders and updates.

* **Error Rate:** <1% failed signups or lost feedback submissions.

### Tracking Plan

* Onboarding started, completed

* Feed viewed

* Opportunity detail viewed

* Sign-up/RSVP completed

* Friend invite sent, accepted

* Notification delivered, opened

* Waitlist signup completed

* RSVP intent clicked

* RSVP intent confirmation viewed

* Feedback form started, submitted

* Opportunity flagged/reported

* NGO post created, attendee managed

* Content item viewed, shared

---

## Technical Considerations

### Technical Needs

* Rules-based recommendation engine for feed personalization (by location, interest, and availability windows; only scheduled opportunities).

* Secure APIs for user accounts, opportunity data, notifications, and feedback.

* Mobile-first, responsive front-end (web/app hybrid for MVP).

* Simple back-end CMS for NGOs to create/manage postings and pull attendee lists.

* Notifications scheduler, calendar integration module.

* Moderation tools, audit logs, analytics event tracking.

### Integration Points

* NGO partner data imports (manual CSV/web input).

* Third-party maps/geocoding (for opportunity locations).

* Email/SMS/push notification provider for reminders and updates.

### Data Storage & Privacy

* Secure user data storage (GDPR-compliant), explicit opt-in for notifications and personal data use.

* User controls for profile/data deletion and social sharing preferences.

* Opportunity and action data stored for analytics and reporting.

* No sensitive payment or health data in MVP.

### Scalability & Performance

* Designed for 200–500 active users during pilot, scalable to 5,000+ with minor infrastructure changes.

* Resilient to event surges; tolerant to updates/cancellations with immediate event data propagation.

### Potential Challenges

* Data accuracy/completeness for NGO-posted opportunities.

* Timely delivery of reminders/updates, especially near event time.

* User trust if few opportunities or poorly described posts; robustness of initial moderation.

* Edge case handling for no-shows, fake accounts, unresponsive partners.

---

## Milestones & Sequencing

### Project Estimate

* **Medium:** 2–4 weeks for MVP build and initial SEE pilot iterations (content, tech, and partner onboarding).

### Team Size & Composition

* **Lean, fast-moving team:** 3–4 people total.

  * Product/PM/founder (strategy, user research, coordination)

  * Design (UX/UI, assets)

  * 1–2 engineers OR no-code developer (full MVP build, analytics setup)

### Suggested Phases

**Week 1: Problem Validation + Supply Discovery (1 week)**

* Key Deliverables: 3–4 user interviews; 2–3 NGO/organizer interviews; draft opportunity submission form; seeded list of 10+ scheduled opportunities from public sources. (Owners: Research lead + Outreach lead)

* Dependencies: Recruiting access (classmates, city groups, LinkedIn) and public opportunity sources.

**Week 2: Instrumented Prototype Build (1 week)**

* Key Deliverables: Prototype with onboarding → curated feed → detail → RSVP intent; analytics events implemented; landing/waitlist page live. (Owner: Prototype lead)

* Dependencies: Finalized opportunity data fields and consent language.

**Week 3: User Testing + Iteration (1 week)**

* Key Deliverables: 3–4 additional user interviews + 3–5 usability tests; measure funnel; iterate copy/flow to reduce friction; test 2–3 nudge message concepts (as copy tests). (Owner: Research lead)

* Dependencies: A steady stream of testers.

**Week 4: Synthesis + Go/No-Go + Next Plan (1 week)**

* Key Deliverables: Findings readout, updated assumptions, quantified funnel, partnership learnings, and a concrete next-step pilot plan (what needs to be built + who must commit). (Owner: PM)

---