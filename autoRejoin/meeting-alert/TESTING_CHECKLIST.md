# Phase 1 - Pre-Deployment Testing Checklist

## Environment Setup
- [ ] Dev server running: npm run dev
- [ ] Environment variables loaded (check .env.local)
- [ ] Supabase connection working
- [ ] Stripe test mode enabled

## Build Test
- [ ] Run: npm run build
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build warnings (or acceptable warnings noted)

## Authentication Flow
- [ ] Visit homepage (localhost:3000)
- [ ] Click "Get Started"
- [ ] Sign in page loads
- [ ] Google OAuth button appears
- [ ] Can complete sign-in flow
- [ ] Redirected to dashboard after sign-in
- [ ] User created in Supabase users table
- [ ] Sign out works
- [ ] Sign back in works

## Google Calendar Integration
- [ ] Dashboard shows "Connect Calendar" if not connected
- [ ] Click "Connect Calendar"
- [ ] Google OAuth for calendar works
- [ ] Calendar connected successfully
- [ ] Connection status shows in dashboard

## Meeting Sync
- [ ] Click "Sync Now" button
- [ ] Loading indicator appears
- [ ] Meetings appear in dashboard
- [ ] Correct meeting data (title, time, link)
- [ ] Multiple meetings sync correctly
- [ ] Check Supabase: meetings table populated
- [ ] Meeting data accurate

## Dashboard Display
- [ ] Meetings display in list
- [ ] Meeting cards show title
- [ ] Meeting cards show time
- [ ] Join button links to correct URL
- [ ] Empty state shows if no meetings
- [ ] No console errors (F12)
- [ ] Clean, professional appearance

## Stripe Payments
- [ ] Visit /pricing page
- [ ] Pricing shows $49/month
- [ ] Click "Subscribe" or "Get Started"
- [ ] Stripe checkout loads
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Any future expiry date, any CVC
- [ ] Payment processes successfully
- [ ] Redirected after payment
- [ ] Subscription created in Stripe dashboard
- [ ] User subscription status updated in database

## Landing Page
- [ ] Visit homepage (/)
- [ ] Hero section displays
- [ ] All sections load correctly
- [ ] Images load (if any)
- [ ] CTAs link correctly (/pricing, /dashboard)
- [ ] Footer links work
- [ ] Mobile responsive (resize browser)
- [ ] Smooth scrolling navigation works
- [ ] No console errors

## Error Handling
- [ ] Try to access /dashboard without auth → Redirects to login
- [ ] Invalid calendar sync shows error
- [ ] Network errors handled gracefully
- [ ] No unhandled promise rejections

## Performance
- [ ] Homepage loads quickly (< 2 seconds)
- [ ] Dashboard loads quickly
- [ ] No lag when syncing calendar
- [ ] Smooth animations
- [ ] No memory leaks (check DevTools)

## Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in incognito mode
- [ ] Responsive on mobile size (resize browser)

## Database Integrity
- [ ] Check Supabase: users table has entries
- [ ] Check: meetings table has correct data
- [ ] Check: subscriptions table (if payment tested)
- [ ] Foreign key relationships correct
- [ ] No orphaned records

## Security
- [ ] Can't access other user's meetings
- [ ] API routes require authentication
- [ ] Environment variables not exposed client-side
- [ ] No sensitive data in console logs

## Known Issues (Document These)
- Known issue 1: [Describe]
- Known issue 2: [Describe]
- Known issue 3: [Describe]

(These are issues you're aware of but won't fix before deploy)

## Critical Issues (Must Fix Before Deploy)
- [ ] No critical bugs found
- [ ] All core features working
- [ ] No data corruption issues
- [ ] No security vulnerabilities

## Pre-Deploy Final Checks
- [ ] All critical items above checked
- [ ] Build succeeds: npm run build
- [ ] Production mode works: npm start
- [ ] Environment variables documented
- [ ] Backup created (git commit)
- [ ] Ready to deploy!

---

## Notes Section

Use this space to document:
- Issues found during testing
- Workarounds applied
- Things to fix post-launch
- Performance observations
- User feedback (if beta tested)

---

**Testing completed by:** _______________
**Date:** _______________
**Ready for deployment:** YES / NO
**If NO, why:** _______________
