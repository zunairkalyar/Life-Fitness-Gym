# Security Specification: Kalyar Fitness Club

This document models the Attribute-Based Access Control (ABAC) and Zero-Trust validation invariants for the “Kalyar Fitness Club” Firestore model.

## 1. Core Data Invariants

1. **Role Protection (RBAC)**: Users cannot modify their own roles (`role` or `isAdmin`). A user's role can only be modified by a `super_admin` or `admin`.
2. **PII Protection**: Personally Identifiable Information (such as CNIC, DOB, Home Address, and Phone numbers) in membership records is only readable by the owner (`uid` matches) or authorized staff/admins.
3. **Write Path Hardening**: No member or non-authenticated client can direct-approve their own `membershipApplications` or `payments` to "Paid". These transition operations require staff-only verification.
4. **Leaderboard Integrity**: A user can submit `competitionAttempts`, but the status is defaulted to `Pending` and cannot be set to `Approved` or `Disqualified` except by users with `trainer`, `admin`, or `super_admin` roles.
5. **No Orphan Writes**: A monthly winning record or credit cannot be created without verified reference objects.

---

## 2. The "Dirty Dozen" Adversarial Payloads

Here are 12 specific payloads representing hostile operations that the Firestore rules must decline.

### Payload 1: Self-Service Super Admin Promotion (Users Collection)
* **Goal**: A standard user tries to update their own document to claim admin rights.
* **Payload**:
  ```json
  {
    "uid": "victim_user_123",
    "email": "hacker@domain.com",
    "name": "Evil Bob",
    "role": "super_admin"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Self-modifying `role` to administrative keys is restricted.

### Payload 2: Overwrite Payment to "Paid" without Cash Handover (Payments Collection)
* **Goal**: A user manually updates their purchase invoice status to gain gratis membership.
* **Payload**:
  ```json
  {
    "paymentId": "pay_555",
    "receiptNo": "REC-9999",
    "memberId": "member_bob",
    "finalPaidAmount": 0,
    "paymentStatus": "Paid"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Non-staff writes to invoice status parameters are locked.

### Payload 3: Direct-Approval of Membership Application (Applications Collection)
* **Goal**: An unapproved applicant updates their entry to "Approved".
* **Payload**:
  ```json
  {
    "applicationId": "app_bob",
    "status": "Approved"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Transition to `Approved` requires staff validation privileges.

### Payload 4: Self-Verifying Bench Press REP Challenge (Attempts Collection)
* **Goal**: A member enters their own challenge attempt as "Approved" with 120 repetitions.
* **Payload**:
  ```json
  {
    "attemptId": "rep_999",
    "memberId": "attacker_uid",
    "exerciseId": "bench_press",
    "score": 120,
    "status": "Approved"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Attempt validation to `Approved` can only be set by registered trainers/admins.

### Payload 5: Snooping Another Member's PII Profile (Members Collection)
* **Goal**: An authenticated member tries to fetch another member's details.
* **Payload**:
  ```javascript
  db.collection("members").doc("victim_member_id").get()
  ```
* **Expectation**: `PERMISSION_DENIED` - Non-admin/staff cannot read profiles unless they are the owner.

### Payload 6: Modifying Gym Profile Opening Hours (Settings Collection)
* **Goal**: A general member changes the male/female timing parameters of the gym.
* **Payload**:
  ```json
  {
    "gymName": "Hacked Fitness Club",
    "phone": "0000000",
    "whatsApp": "0000000",
    "timings": { "maleMorning": "11:00 AM to 11:15 AM" }
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Only admins or super admins can write to `settings/`.

### Payload 7: Inadequate ID Length Injection (Path Poisoning Attack)
* **Goal**: A script tries to push junk-character keys to crash indices (e.g. 5KB path variables).
* **Payload**:
  `db.collection("attendance").doc("A".repeat(2000)).set(...)`
* **Expectation**: `PERMISSION_DENIED` - ID validation limits string lengths.

### Payload 8: Chrono-Spurred Creation Logs (Temporal Integrity Bypass)
* **Goal**: Attempt to post-date daily check-ins into next week.
* **Payload**:
  ```json
  {
    "recordId": "rec_01",
    "memberId": "member_bob",
    "date": "2026-10-31",
    "createdAt": "2026-10-31T00:00:00Z"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Creation records must match `request.time`.

### Payload 9: Forging Testimonials from Other Users (Testimonials Collection)
* **Goal**: Writing a dummy testimonial under another person's name.
* **Payload**:
  ```json
  {
    "name": "Target Celebrity",
    "rating": 5,
    "text": "This place is spectacular!"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Testimonials are modifiable only by admins, or authenticated authors matching their user UID.

### Payload 10: Setting Expire Dates Far in the Future (Members Collection)
* **Goal**: A member extends their membership expiry by 10 years without paying.
* **Payload**:
  `db.collection("members").doc("attacker_uid").update({ "expiryDate": "2036-12-31" })`
* **Expectation**: `PERMISSION_DENIED` - Member field modifications require administrative roles.

### Payload 11: Blanket Unrestricted Scan of All Payments (Leak Inspection)
* **Goal**: A general logged-in user requests a listing of all payment traces.
* **Payload**:
  `db.collection("payments").get()`
* **Expectation**: `PERMISSION_DENIED` - Unsafe list queries are blocked unless query is bound specifically to `memberId == auth.uid`.

### Payload 12: Phantom Credit Generation (Credits Collection)
* **Goal**: A member injects a fake free month credit into the database.
* **Payload**:
  ```json
  {
    "creditId": "free_992",
    "memberId": "attacker_uid",
    "status": "Available"
  }
  ```
* **Expectation**: `PERMISSION_DENIED` - Credit creations are strictly restricted to staff/admins.

---

## 3. Test Runner Blueprint

Our validation is verified via structural tests that mock incoming authentication tokens:
1. `isAdmin` checks lookup `/databases/$(database)/documents/users/$(request.auth.uid)` to ensure their role is either `super_admin` or `admin`.
2. `isStaff` checks if role is `reception` or above.
3. `isTrainer` checks if role is `trainer` or above.
