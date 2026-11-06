# Timetable Designer – Advanced Features

For your React Flow-based Timetable Designer, you can build much more than basic drag-and-drop nodes. The designer can become a complete visual academic scheduling workspace where users configure academic structures, define constraints, validate relationships, generate timetables, and optimize schedules.

Here are additional features organized by module.

## 1. Visual Canvas & React Flow

```

Timetable Designer
│
├── Canvas
│   ├── Infinite Canvas
│   ├── Zoom In / Zoom Out
│   ├── Zoom to Fit
│   ├── Pan and Move
│   ├── Mini Map
│   ├── Grid Background
│   ├── Snap to Grid
│   ├── Canvas Lock / Unlock
│   ├── Fullscreen Mode
│   ├── Multi-Select Nodes
│   ├── Box Selection
│   ├── Select All
│   ├── Copy / Paste Nodes
│   ├── Duplicate Nodes
│   ├── Delete Nodes
│   ├── Undo / Redo
│   └── Canvas Reset

```

### Advanced canvas features

- Custom grid sizes.
- Node alignment guides.
- Smart snapping.
- Selection rectangle.
- Keyboard shortcuts.
- Context menu on right-click.
- Node position persistence.
- Smooth zoom and pan.
- Canvas viewport restoration.
- Lock individual nodes.
- Hide/show nodes.
- Focus mode for selected nodes.

## 2. Academic Structure Nodes

Create custom nodes for your institution's academic structure.

```

Institution
   │
   ├── Department
   │      │
   │      ├── Program
   │      │      │
   │      │      ├── Academic Year
   │      │      │      │
   │      │      │      ├── Semester
   │      │      │      │      │
   │      │      │      │      ├── Section
   │      │      │      │      └── Subjects

```

Features:

- Institution node.
- Department node.
- Program node.
- Academic year node.
- Semester node.
- Section node.
- Batch node.
- Student strength configuration.
- Academic hierarchy visualization.
- Node relationship validation.
- Multiple departments in one graph.
- Multiple sections under one semester.
- Reusable academic structure templates.

## 3. Faculty Nodes

Faculty nodes represent teaching resources.

Features:

- Faculty profile node.
- Faculty availability configuration.
- Faculty workload display.
- Maximum teaching hours.
- Minimum teaching hours.
- Preferred teaching periods.
- Unavailable time slots.
- Faculty-subject relationship.
- Faculty-department relationship.
- Multiple subject assignments.
- Faculty qualification validation.
- Faculty workload visualization.
- Faculty conflict highlighting.
- Faculty assignment recommendations.

Advanced: Display faculty availability directly inside the node using a compact weekly schedule.

## 4. Subject Nodes

Features:

- Theory subject nodes.
- Laboratory subject nodes.
- Tutorial subject nodes.
- Elective subject nodes.
- Subject code.
- Subject credits.
- Weekly lecture hours.
- Weekly laboratory hours.
- Required consecutive periods.
- Faculty assignment.
- Room type requirement.
- Student enrollment.
- Subject dependency.
- Subject group configuration.

### Advanced subject configuration

Example:

```
Subject: Data Structures

Type: Theory
Weekly Hours: 4
Faculty: Faculty A
Room: Classroom
Consecutive Periods: 1
Preferred Days: Monday, Wednesday
```

For laboratory subjects:

```
Subject: Java Lab

Type: Laboratory
Weekly Hours: 3
Faculty: Faculty B
Room: Computer Lab
Consecutive Periods: 3
```

## 5. Room Nodes

Features:

- Classroom node.
- Laboratory node.
- Seminar hall node.
- Room capacity.
- Room availability.
- Room type.
- Equipment requirements.
- Department ownership.
- Room allocation.
- Room-subject compatibility.
- Room utilization indicator.
- Room conflict detection.
- Room availability visualization.

Advanced:

- Equipment-based room matching.
- Capacity-based room assignment.
- Laboratory-specific allocation.
- Room reservation constraints.
- Shared classroom scheduling.

# 6. Drag & Drop System

This is where you can make the designer feel like a professional visual editor.

### Node drag-and-drop

- Drag nodes from sidebar to canvas.
- Drag nodes within canvas.
- Drag multiple selected nodes.
- Drag nodes between groups.
- Drag nodes into department containers.
- Duplicate nodes using keyboard shortcuts.
- Drop nodes into predefined academic groups.

### Connection drag-and-drop

- Connect faculty to subjects.
- Connect subjects to sections.
- Connect sections to programs.
- Connect subjects to rooms.
- Connect academic structures.
- Create relationships using handles.

### Connection validation

- Prevent invalid connection types.
- Prevent duplicate relationships.
- Prevent circular academic dependencies.
- Validate source and target node types.
- Validate required relationships.
- Display connection error messages.

Example:

```
Faculty ───── Subject      Valid

Room ───── Faculty        Invalid

Section ───── Subject     Valid
```

You can implement this using custom React Flow node types and connection validation.

# 7. Node Configuration Panel

When the user selects a node, display its configuration in a right-side panel.

```

┌──────────────────────────────────────────┐
│ Timetable Designer                     │
├───────────────┬──────────────────────────┤
│              │ Node Configuration      │
│              │                          │
│   Canvas     │ Subject Name             │
│              │ [Data Structures      ]   │
│              │                          │
│              │ Subject Type             │
│              │ [Theory              ▼]  │
│              │                          │
│              │ Weekly Hours             │
│              │ [4                     ] │
│              │                          │
│              │ Faculty                  │
│              │ [Select Faculty       ▼] │
│              │                          │
│              │ Room                     │
│              │ [Select Room          ▼] │
│              │                          │
│              │ [Save Configuration]     │
└───────────────┴──────────────────────────┘

```

Features:

- Dynamic node forms.
- Field validation.
- Required field indicators.
- Configuration tabs.
- Inline editing.
- Save and cancel.
- Reset configuration.
- Node-specific settings.
- Validation error display.
- Configuration change detection.

# 8. Graph Validation Engine

Instead of checking only whether connections are valid, build a complete graph validation system.

### Structural validation

- Institution must exist.
- Department must belong to institution.
- Program must belong to department.
- Academic year must belong to program.
- Section must belong to academic year.
- Subject must be assigned to section.
- Faculty must be assigned to subject.
- Room must be assigned where required.

### Constraint validation

- Faculty availability.
- Room availability.
- Section availability.
- Maximum faculty workload.
- Subject weekly hours.
- Laboratory duration.
- Room capacity.
- Consecutive period requirements.
- Duplicate assignments.

### Validation UI

```

Graph Validation

✓ Institution configuration valid
✓ Department relationships valid
✓ Academic structure valid

⚠ Faculty assignment missing
⚠ Laboratory room not configured

✕ Duplicate faculty connection

[View Errors]
[Fix Automatically]

```

### Validation levels

| Level   | Meaning                                 |
| ------- | --------------------------------------- |
| Error   | Prevents generation                     |
| Warning | Generation allowed, but needs attention |
| Info    | Configuration suggestion                |

Add:

- Validate entire graph.
- Validate selected node.
- Validate selected connection.
- Validate before generation.
- Real-time validation.
- Validation summary.
- Error navigation.
- Auto-fix suggestions.

# 9. Auto Arrange & Layout Engine

Your existing Dagre integration can be expanded.

Features:

- Hierarchical layout.
- Horizontal layout.
- Vertical layout.
- Compact layout.
- Department-based layout.
- Academic hierarchy layout.
- Faculty grouping.
- Subject grouping.
- Room grouping.
- Automatic node spacing.
- Automatic edge routing.
- Layout preview.
- Layout reset.

### Advanced layout

Allow users to choose:

```
Layout Direction

○ Top to Bottom
○ Left to Right
○ Bottom to Top
○ Right to Left
```

Additional options:

- Group connected nodes.
- Align nodes.
- Distribute nodes evenly.
- Arrange selected nodes.
- Arrange entire graph.
- Preserve manual positions.
- Minimize edge crossings.
- Avoid node overlap.

Recommendation: Use Dagre for hierarchical layouts. Consider ELK when you need more advanced routing and layout control. Both are layout tools; neither solves timetable scheduling constraints.

# 10. Node Grouping & Containers

This is a particularly useful feature for your academic graph.

Create visual containers such as:

```
┌────────────────────────────────────┐
│ CSE - 3rd Year                   │
│                                  │
│  Section A                       │
│  ├── Data Structures             │
│  ├── DBMS                       │
│  └── Operating Systems           │
│                                  │
└────────────────────────────────────┘
```

Features:

- Department containers.
- Program containers.
- Semester containers.
- Section containers.
- Faculty groups.
- Subject groups.
- Nested groups.
- Collapse and expand groups.
- Move group with child nodes.
- Group-level configuration.
- Group-level validation.

# 11. Graph Templates

Allow users to save reusable graph configurations.

Features:

- Create graph template.
- Save as template.
- Duplicate template.
- Import template.
- Export template.
- Template categories.
- Template preview.
- Template versioning.
- Template sharing.

Example templates:

```
CSE Semester Template
ECE Semester Template
Laboratory Scheduling Template
Engineering College Template
```

A user should be able to create a new timetable design using an existing template instead of rebuilding the graph from scratch.

# 12. Undo, Redo & History

A professional editor needs reliable history.

Features:

- Undo node creation.
- Undo node deletion.
- Undo node movement.
- Undo connection creation.
- Undo configuration updates.
- Redo actions.
- History panel.
- Restore previous graph state.
- Graph snapshots.
- Version comparison.

Example:

```
Graph History

10:30 AM  Faculty node created
10:32 AM  Subject connection added
10:34 AM  Room configuration updated
10:36 AM  Graph validated
```

# 13. Auto Save & Persistence

Features:

- Auto-save graph.
- Manual save.
- Save status indicator.
- Save graph to MongoDB.
- Restore graph after refresh.
- Save node positions.
- Save node configurations.
- Save connections.
- Save viewport state.
- Save graph metadata.
- Detect unsaved changes.
- Prevent accidental data loss.

### Advanced

- Save graph revisions.
- Restore previous revision.
- Concurrent editing detection.
- Conflict resolution.
- Background persistence.
- Save only changed graph elements.

For larger graphs, consider storing graph configuration separately from generated timetable data.

# 14. Graph Search & Navigation

Features:

- Search nodes by name.
- Search by faculty ID.
- Search by subject code.
- Search by department.
- Search by room.
- Highlight search results.
- Focus selected node.
- Navigate between connected nodes.
- Filter node types.
- Hide unrelated nodes.
- Clear search.

Example:

```
Search: Data Structures

Results:
- Subject: Data Structures
- Faculty: Ramesh Kumar
- Section: CSE-A
```

Clicking a result should focus and highlight the corresponding node.

# 15. Smart Connections & Recommendations

Add intelligent suggestions when users configure the graph.

Features:

- Recommend faculty for subjects.
- Recommend rooms for subjects.
- Suggest missing connections.
- Detect unused faculty.
- Detect unused rooms.
- Detect subjects without sections.
- Recommend compatible laboratory rooms.
- Suggest academic structure relationships.
- Identify incomplete configurations.

Example:

```
Subject: Java Programming

Recommended Faculty:
1. Faculty A
2. Faculty B

Recommended Room:
Computer Lab 2

Reason:
Room supports required laboratory equipment.
```

Recommendations should use actual faculty qualifications, availability, subject requirements, and room configuration.

# 16. Graph-Based Scheduling Constraints

This is where your designer connects directly to the timetable engine.

Features:

- Faculty availability constraints.
- Room availability constraints.
- Section availability constraints.
- Subject duration constraints.
- Faculty workload constraints.
- Laboratory consecutive-period constraints.
- Preferred period constraints.
- Maximum classes per day.
- Minimum break requirements.
- Department-specific rules.

### Constraint configuration panel

```
Scheduling Constraints

Faculty:
✓ No overlapping classes
✓ Maximum 5 periods per day
✓ Respect availability

Room:
✓ No overlapping bookings
✓ Match room capacity

Section:
✓ No overlapping subjects
✓ Maximum 7 periods per day

Laboratory:
✓ 3 consecutive periods
✓ Laboratory room required
```

Separate hard constraints from soft constraints.

- Hard constraints: Must be satisfied.
- Soft constraints: Preferences to optimize.

# 17. Timetable Preview From Graph

Before generating the final timetable, provide a preview.

Features:

- Preview academic structure.
- Preview faculty assignments.
- Preview room assignments.
- Preview weekly subject hours.
- Preview section workload.
- Preview scheduling constraints.
- Preview missing configurations.
- Preview generation readiness.

Example:

```
Generation Readiness

Sections: 4
Faculty: 18
Subjects: 24
Rooms: 12

Configuration:
92% complete

Missing:
- 2 faculty assignments
- 1 laboratory room

[Validate Graph]
[Generate Timetable]
```

# 18. Graph Import & Export

Features:

- Export graph as JSON.
- Import graph JSON.
- Export graph image.
- Export graph SVG.
- Export graph configuration.
- Import academic structure.
- Import nodes from Excel.
- Import connections from configuration.
- Download graph backup.

Example graph data:

```
{
  "nodes": [
    {
      "id": "subject-1",
      "type": "subject",
      "position": {
        "x": 200,
        "y": 300
      },
      "data": {
        "name": "Data Structures",
        "weeklyHours": 4
      }
    }
  ],
  "edges": []
}
```

# 19. Collaboration Features

For multiple timetable designers:

- Shared graph editing.
- Read-only access.
- Editor permissions.
- Admin permissions.
- Graph ownership.
- Collaboration invitations.
- User activity indicators.
- Live graph updates.
- Concurrent editing detection.
- Comments on nodes.
- Approval workflow.

For real-time collaboration, you can use Socket.IO, but conflict resolution needs careful design. Simply broadcasting node updates is not sufficient when multiple users edit the same graph simultaneously.

# 20. Graph Performance & Reliability

Features:

- Lazy loading large graph sections.
- Efficient node rendering.
- Memoized custom nodes.
- Virtualized sidebar lists.
- Debounced auto-save.
- Graph update batching.
- Background validation.
- Error recovery.
- Graph integrity checks.
- Performance monitoring.

For large institutions with hundreds or thousands of graph nodes, performance becomes important.

# 21. Advanced UI Features

- Dark mode.
- Light mode.
- Node color customization.
- Connection color customization.
- Node icons.
- Custom node shapes.
- Node badges.
- Status indicators.
- Graph overview.
- Floating toolbar.
- Resizable sidebar.
- Collapsible panels.
- Fullscreen editor.
- Keyboard shortcuts.
- Context menus.
- Tooltips.
- Interactive onboarding.

# 22. Recommended Designer Toolbar

```

┌────────────────────────────────────────────────────────────────┐
│ Timetable Designer                                           │
├────────────────────────────────────────────────────────────────┤
│ [Undo] [Redo] [Save] [Validate] [Generate] [Publish]         │
│                                                                │
│ [Zoom In] [Zoom Out] [Fit View] [Auto Arrange] [Fullscreen]   │
│                                                                │
│ [Search Nodes] [Templates] [Import] [Export] [History]         │
├───────────────┬────────────────────────────┬───────────────────┤
│ Node Sidebar  │                          │ Configuration      │
│               │                          │                   │
│ Institution    │                          │ Selected Node     │
│ Department     │         Canvas           │                   │
│ Program        │                          │ Properties       │
│ Faculty        │                          │ Constraints      │
│ Subject        │                          │ Validation       │
│ Room           │                          │                   │
│ Section        │                          │                   │
└───────────────┴────────────────────────────┴───────────────────┘

```

# 23. Best feature priority

I recommend implementing these first:

| Priority | Feature                  |
| -------- | ------------------------ |
| P0       | Custom nodes and handles |
| P0       | Drag-and-drop sidebar    |
| P0       | Connection validation    |
| P0       | Node configuration panel |
| P0       | Auto-save                |
| P0       | Graph validation         |
| P1       | Undo/redo                |
| P1       | Auto arrange             |
| P1       | Node grouping            |
| P1       | Graph templates          |
| P1       | Search and navigation    |
| P1       | Scheduling constraints   |
| P2       | Graph history            |
| P2       | Import/export            |
| P2       | AI recommendations       |
| P2       | Real-time collaboration  |

My strongest recommendation: Build the designer around five core systems:

1. Graph Editor – React Flow, custom nodes, drag-and-drop, grouping.
2. Graph Configuration – Node properties, academic relationships, constraints.
3. Graph Validation – Structural validation, connection validation, scheduling readiness.
4. Graph Persistence – Auto-save, versioning, undo/redo, restoration.
5. Scheduling Integration – Convert validated graph data into scheduling inputs and display generation results.

This separation will make the designer easier to maintain and prevent React Flow UI logic from becoming tightly coupled to your timetable generation algorithm.

# Authentication & Identity Management – Advanced Features

For your Timetable Generator (MERN + Node.js + Express + MongoDB + Redis), authentication should be designed as a complete identity and security module, not just login and registration.

Since you're already working with access tokens, refresh tokens, Redis sessions, OTP verification, and role-based access control, I recommend organizing authentication into the following modules.

# 1. Authentication Core

```
Authentication
│
├── Registration
├── Login
├── Logout
├── Session Management
├── Token Management
├── Email Verification
├── Password Management
├── MFA
├── Account Recovery
└── Security Monitoring
```

### Features

- User registration.
- Email verification.
- Login with email and password.
- Logout from current session.
- Logout from all devices.
- Access token management.
- Refresh token rotation.
- Session creation and termination.
- Account status management.
- Authentication history.
- Secure password storage.
- Authentication error handling.

# 2. Session Management

Session management is one of the most important features for your application.

Instead of only storing a JWT in the browser, maintain a server-side session record that represents each authenticated device.

### Session features

- Create session after successful login.
- Store sessions in Redis.
- Track active sessions.
- Track device information.
- Track browser information.
- Track IP address.
- Track login location at a coarse level.
- Session expiration.
- Session renewal.
- Session revocation.
- Logout from current device.
- Logout from all devices.
- View active sessions.
- Terminate individual sessions.
- Detect expired sessions.
- Detect revoked sessions.
- Session activity timestamps.
- Session inactivity timeout.
- Maximum session lifetime.

### Active sessions UI

```
Active Sessions

Current Device
Chrome · Windows
Last Active: Just now
Status: Active

Other Device
Android · Chrome
Last Active: 2 hours ago
Status: Active

[Terminate Session]
[Logout All Devices]
```

### Recommended session architecture

```
Browser
   │
   │ HTTP-only Cookie
   ▼
Access Token
   │
   ▼
Express Middleware
   │
   ▼
Validate Token
   │
   ▼
Redis Session
   │
   ▼
User Authentication
   │
   ▼
Authorization
```

Important: A valid JWT alone should not automatically mean that the session is still active if you support session revocation. Your authentication middleware must check the relevant session state.

# 3. Access & Refresh Token Management

You can use your existing access-token and refresh-token architecture.

### Access token

- Short expiration.
- Used to authenticate API requests.
- Contains user ID and session ID.
- Contains minimal identity information.
- Validated by backend middleware.

### Refresh token

- Longer expiration.
- Used to obtain new access tokens.
- Stored in a secure HTTP-only cookie.
- Associated with a server-side session.
- Rotated after successful refresh.
- Revoked on logout.
- Reuse detection.

### Advanced features

- Refresh token rotation.
- Refresh token hashing.
- Refresh token family tracking.
- Token revocation.
- Session-bound tokens.
- Token expiration handling.
- Reuse detection.
- Concurrent refresh handling.
- Access-token invalidation strategy.
- Token versioning.
- Session versioning.

### Recommended token flow

```
Login
  │
  ▼
Create Session
  │
  ▼
Generate Access Token
  │
  ▼
Generate Refresh Token
  │
  ▼
Store Session in Redis
  │
  ▼
Set Secure Cookies
  │
  ▼
Authenticated API Requests
```

When access token expires:

```
Client
  │
  ▼
POST /api/v1/auth/refresh
  │
  ▼
Validate Refresh Token
  │
  ▼
Check Redis Session
  │
  ▼
Rotate Refresh Token
  │
  ▼
Issue New Access Token
  │
  ▼
Update Session
```

# 4. Multi-Factor Authentication (MFA)

MFA provides additional authentication beyond the password.

For your timetable application, MFA can be enabled for administrators, timetable designers, and users who want stronger account security.

### MFA methods

| Method         | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| Email OTP      | Verification code sent to registered email                          |
| TOTP           | Authenticator app generates time-based codes                        |
| Recovery codes | Backup codes for account recovery                                   |
| Passkeys       | Passwordless authentication using device credentials                |
| WebAuthn       | Standards-based authentication with security keys or authenticators |

### TOTP features

- Enable MFA.
- Disable MFA.
- Generate authenticator secret.
- Display QR code.
- Verify authenticator code.
- Generate recovery codes.
- Regenerate recovery codes.
- Track MFA enrollment.
- Require MFA for sensitive operations.
- Require MFA for administrator accounts.

### MFA enrollment flow

```
User Settings
    │
    ▼
Enable MFA
    │
    ▼
Generate TOTP Secret
    │
    ▼
Display QR Code
    │
    ▼
Scan Using Authenticator App
    │
    ▼
Enter Verification Code
    │
    ▼
Verify TOTP
    │
    ▼
Enable MFA
    │
    ▼
Generate Recovery Codes
```

### Login with MFA

```
Email + Password
      │
      ▼
Validate Credentials
      │
      ▼
MFA Enabled?
      │
      ├── No → Complete Login
      │
      └── Yes
            │
            ▼
       Verify MFA Code
            │
            ▼
       Complete Login
```

Security recommendation: MFA enrollment, disabling MFA, and recovery-code regeneration should require recent authentication. Disabling MFA should not be allowed using only an existing long-lived session.

# 5. Password Management

### Password features

- Password creation.
- Password validation.
- Password hashing.
- Password change.
- Forgot password.
- Password reset.
- Password confirmation.
- Password history.
- Password reuse prevention.
- Password reset token expiration.
- Password reset token revocation.
- Password change notification.

### Advanced security

- Argon2id password hashing.
- Password strength validation.
- Breached-password screening.
- Password reset rate limiting.
- Password reset email verification.
- Revoke sessions after password reset.
- Require reauthentication for password changes.

Example password policy:

```
Minimum Length: 12 characters
Maximum Length: 128 characters

Allow:
- Letters
- Numbers
- Special characters
- Spaces

Reject:
- Common passwords
- Known compromised passwords
```

Avoid arbitrary rules requiring every password to contain a particular combination of symbols if they interfere with passphrases. Prefer length, compromised-password screening, and rate limiting.

# 6. Email Verification & OTP

### Features

- Email verification.
- OTP generation.
- OTP expiration.
- OTP resend.
- OTP attempt limits.
- OTP verification.
- OTP invalidation.
- Email change verification.
- Login email verification.
- Account recovery verification.

### Advanced OTP features

- Cryptographically secure OTP generation.
- Store OTP hashes instead of plaintext.
- OTP expiration.
- OTP single-use enforcement.
- Resend cooldown.
- Rate limiting.
- Maximum verification attempts.
- Invalidate previous OTP when generating a new one.
- Prevent OTP enumeration.
- Security notifications.

### OTP flow

```
Register
   │
   ▼
Generate OTP
   │
   ▼
Store OTP Hash
   │
   ▼
Send Email
   │
   ▼
User Enters OTP
   │
   ▼
Validate OTP
   │
   ▼
Mark Email Verified
```

Email OTP is useful for verification and recovery, but TOTP or passkeys are stronger choices for MFA.

# 7. Account Recovery

Users should be able to recover their accounts without creating security vulnerabilities.

### Features

- Forgot password.
- Reset password.
- Recovery email.
- MFA recovery.
- Recovery codes.
- Account recovery verification.
- Recovery attempt limits.
- Recovery session management.
- Notify user after recovery.
- Revoke suspicious sessions.

### Recovery workflow

```
Forgot Password
      │
      ▼
Enter Email
      │
      ▼
Send Recovery Link
      │
      ▼
Validate Token
      │
      ▼
Verify Identity
      │
      ▼
Reset Password
      │
      ▼
Revoke Existing Sessions
      │
      ▼
Notify User
```

Return a generic response when requesting recovery:

```
If an account exists for this email,
recovery instructions will be sent.
```

This prevents attackers from discovering registered email addresses.

# 8. Passkeys & Passwordless Authentication

This is an advanced feature worth adding later.

### Features

- Register passkey.
- Authenticate with passkey.
- Remove passkey.
- Multiple passkeys per account.
- Passkey device management.
- Passkey authentication history.
- Passkey-based account recovery options.
- Require passkey for sensitive actions.

### Example

```
Authentication Methods

Password
Email Verification
Authenticator App
Passkey

Registered Passkeys:
- Windows Hello
- Android Device

[Add Passkey]
[Remove Passkey]
```

Use WebAuthn-compatible libraries and verify all registration and authentication challenges on the backend.

# 9. Role-Based Access Control (RBAC)

Your timetable application needs different permissions for different users.

### Roles

```
Admin
Institution Admin
Timetable Designer
Faculty
Student
```

### Permission examples

| Permission         | Admin | Designer | Faculty  | Student  |
| ------------------ | ----- | -------- | -------- | -------- |
| Manage users       | Yes   | No       | No       | No       |
| Manage institution | Yes   | Assigned | No       | No       |
| Manage faculty     | Yes   | Assigned | No       | No       |
| Edit graph         | Yes   | Assigned | No       | No       |
| Generate timetable | Yes   | Assigned | No       | No       |
| Publish timetable  | Yes   | Assigned | No       | No       |
| View timetable     | Yes   | Assigned | Assigned | Assigned |
| Submit feedback    | Yes   | Yes      | Yes      | Yes      |

### Advanced RBAC

- Role management.
- Permission management.
- Assign roles.
- Remove roles.
- Multiple roles per user.
- Permission inheritance.
- Resource-level permissions.
- Institution-level permissions.
- Department-level permissions.
- Ownership-based access.
- Temporary permissions.
- Permission audit logs.

For your project, use RBAC combined with resource ownership checks.

A designer should only access the institutions, departments, and timetable graphs they are authorized to manage.

# 10. Authorization & Access Control

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Features:

- Route-level authorization.
- Resource-level authorization.
- Institution ownership validation.
- Department access validation.
- Timetable ownership validation.
- Faculty data access control.
- Admin-only operations.
- Read-only access.
- Write access.
- Publish permissions.
- Permission-based API middleware.

Example:

```
User
  │
  ▼
Authenticated?
  │
  ▼
Role Valid?
  │
  ▼
Institution Access?
  │
  ▼
Resource Ownership?
  │
  ▼
Permission Granted
```

Never rely on a frontend role check alone. All authorization decisions must be enforced on the backend.

# 11. Login Security & Threat Protection

### Features

- Login rate limiting.
- OTP rate limiting.
- Refresh-token rate limiting.
- Password reset rate limiting.
- Account lockout policy.
- Suspicious login detection.
- Brute-force protection.
- Credential stuffing protection.
- IP-based risk signals.
- Device-based risk signals.
- Security event logging.
- CAPTCHA or challenge integration when appropriate.

### Advanced account protection

- Failed login tracking.
- Temporary login throttling.
- Suspicious session detection.
- New device notification.
- Login history.
- Session revocation.
- Password compromise alerts.
- Security notification emails.

Avoid permanent account lockout triggered solely by failed login attempts, because attackers could use it to deny service to legitimate users. Prefer progressive throttling and carefully designed recovery.

# 12. Device Management

Allow users to see devices that have authenticated to their account.

### Features

- Device registration.
- Device identification.
- Device name.
- Browser information.
- Operating system.
- Last active timestamp.
- Current device indicator.
- Trusted device management.
- Remove trusted device.
- Terminate device sessions.
- New device notifications.

Example:

```
Devices

1. Windows Laptop
   Chrome
   Last Active: Today
   Current Session

2. Android Phone
   Chrome
   Last Active: Yesterday

[Remove Device]
```

A device fingerprint should not be treated as a reliable identity or authorization factor by itself. Use it as a risk signal.

# 13. Security Notifications

Notify users when important security changes happen.

### Events

- Successful login from a new device.
- Password changed.
- Email address changed.
- MFA enabled.
- MFA disabled.
- Recovery codes regenerated.
- Account recovery completed.
- Session terminated.
- Suspicious login detected.
- Multiple failed login attempts.

### Notification channels

- Email.
- In-app notifications.
- Security activity dashboard.

Example:

```
Security Alert

A new login was detected.

Device: Chrome
Operating System: Windows
Time: 10:30 AM

If this wasn't you:
[Secure My Account]
```

Do not include passwords, OTPs, access tokens, or refresh tokens in notifications.

# 14. Authentication Audit Logs

Track security-relevant events.

### Events

```
AUTH_LOGIN_SUCCESS
AUTH_LOGIN_FAILED
AUTH_LOGOUT
AUTH_SESSION_CREATED
AUTH_SESSION_REVOKED
AUTH_TOKEN_REFRESHED
AUTH_PASSWORD_CHANGED
AUTH_PASSWORD_RESET
AUTH_MFA_ENABLED
AUTH_MFA_DISABLED
AUTH_RECOVERY_COMPLETED
AUTH_PERMISSION_DENIED
```

### Audit log information

- User ID.
- Session ID.
- Event type.
- Timestamp.
- IP address.
- User agent.
- Result.
- Failure reason category.

Security logs should not contain raw passwords, OTPs, access tokens, refresh tokens, or sensitive authentication secrets.

# 15. Account Lifecycle Management

Features:

- Account activation.
- Account suspension.
- Account deactivation.
- Account deletion.
- Account restoration.
- Email change.
- Username change.
- Account verification status.
- Account security status.
- Account access restrictions.

### Admin capabilities

- Suspend user.
- Reactivate user.
- Revoke user sessions.
- Force password reset.
- Require MFA.
- Remove user access.
- View security events.

For account deletion, implement appropriate data-retention and ownership rules instead of immediately deleting records that are needed for academic or audit purposes.

# 16. Authentication API Routes

Recommended route structure:

```
/api/v1/auth
```

### Registration & login

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
```

### Session management

```
GET    /api/v1/auth/sessions
GET    /api/v1/auth/sessions/:sessionId
DELETE /api/v1/auth/sessions/:sessionId
DELETE /api/v1/auth/sessions
```

### Token management

```
POST /api/v1/auth/refresh
POST /api/v1/auth/revoke
```

### Email verification

```
POST /api/v1/auth/email/verify
POST /api/v1/auth/email/resend
```

### Password management

```
POST /api/v1/auth/password/forgot
POST /api/v1/auth/password/reset
PATCH /api/v1/auth/password
```

### MFA

```
POST   /api/v1/auth/mfa/enroll
POST   /api/v1/auth/mfa/verify
POST   /api/v1/auth/mfa/enable
POST   /api/v1/auth/mfa/disable
POST   /api/v1/auth/mfa/recovery
DELETE /api/v1/auth/mfa
```

### User security

```
GET /api/v1/users/me/security
GET /api/v1/users/me/security/activity
GET /api/v1/users/me/security/devices
```

These are suggested API contracts, not framework-provided endpoints. Define request validation, authentication requirements, and response schemas for each.

# 17. Recommended Redis Session Structure

Example conceptual session:

```
{
  "sessionId": "session_123",
  "userId": "user_456",
  "createdAt": "2026-11-06T10:00:00.000Z",
  "lastActiveAt": "2026-11-06T10:30:00.000Z",
  "expiresAt": "2026-11-07T10:00:00.000Z",
  "status": "active",
  "device": {
    "browser": "Chrome",
    "os": "Windows"
  },
  "security": {
    "mfaVerified": true
  }
}
```

For production:

- Store refresh-token hashes.
- Use Redis TTL.
- Keep session expiration synchronized with token policy.
- Use atomic operations for refresh rotation.
- Avoid storing unnecessary personal information.
- Separate session state from authentication audit logs.

# 18. Authentication Frontend Pages

```
Authentication UI
│
├── Sign Up
├── Sign In
├── Email Verification
├── MFA Verification
├── Forgot Password
├── Reset Password
├── Account Recovery
│
├── Security Settings
│   ├── Change Password
│   ├── Enable MFA
│   ├── Manage Recovery Codes
│   ├── Manage Passkeys
│   ├── Active Sessions
│   ├── Trusted Devices
│   └── Security Activity
│
└── Admin Security
    ├── User Management
    ├── Session Management
    ├── Security Events
    └── Access Control
```

# 19. Recommended Authentication Architecture

```
Client
  │
  ▼
Next.js / React
  │
  ▼
Express API
  │
  ├── Authentication Middleware
  │
  ├── Authorization Middleware
  │
  ├── Rate Limiting
  │
  ├── Validation
  │
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ├── Password Service
  ├── Token Service
  ├── Session Service
  ├── MFA Service
  ├── Recovery Service
  └── Security Event Service
  │
  ├── Redis
  │     └── Active Sessions
  │
  └── MongoDB
        ├── Users
        ├── MFA Configuration
        ├── Recovery Codes
        └── Security Audit Events
```

# 20. Best Feature Priority

| Priority | Features                        |
| -------- | ------------------------------- |
| P0       | Registration, login, logout     |
| P0       | Access and refresh tokens       |
| P0       | Session management              |
| P0       | Email verification              |
| P0       | Password reset                  |
| P0       | RBAC and resource authorization |
| P0       | Rate limiting                   |
| P1       | Logout from all devices         |
| P1       | Active sessions dashboard       |
| P1       | TOTP MFA                        |
| P1       | Recovery codes                  |
| P1       | Security notifications          |
| P1       | Audit logs                      |
| P1       | Device management               |
| P2       | Passkeys                        |
| P2       | Risk-based authentication       |
| P2       | Advanced account recovery       |
| P2       | Admin security dashboard        |

## Final recommendation

For your timetable project, prioritize these 10 authentication features:

1. Secure registration and login.
2. Access and refresh token rotation.
3. Redis-backed session management.
4. Logout from individual and all devices.
5. Email verification and password recovery.
6. TOTP-based MFA.
7. Role-based and resource-level authorization.
8. Active session and device management.
9. Security notifications.
10. Authentication audit logs.

These provide a strong foundation without making authentication unnecessarily complicated. Add passkeys and risk-based authentication after the core session and MFA flows are reliable.

# Timetable Editor – Advanced Features

For your AI-Powered Timetable Generator, the Schedule Editor should be a powerful interactive workspace where users can edit the entire timetable, individual cells, periods, faculty assignments, rooms, and subjects.

The most important design principle:

Every cell should be editable independently, while the editor continuously validates the entire timetable for scheduling conflicts.

# 1. Timetable Editor – Main Features

```

Timetable Editor
│
├── Schedule Table
│   ├── Weekly Timetable
│   ├── Daily Timetable
│   ├── Section View
│   ├── Faculty View
│   └── Room View
│
├── Cell Editor
│   ├── Click to Edit
│   ├── Double Click to Edit
│   ├── Drag and Drop
│   ├── Copy Cell
│   ├── Paste Cell
│   ├── Clear Cell
│   └── Swap Cells
│
├── Schedule Operations
│   ├── Add Period
│   ├── Remove Period
│   ├── Move Period
│   ├── Add Break
│   ├── Merge Cells
│   └── Split Cells
│
├── Validation
│   ├── Faculty Conflicts
│   ├── Room Conflicts
│   ├── Section Conflicts
│   └── Constraint Validation
│
└── History
    ├── Undo
    ├── Redo
    ├── Auto Save
    └── Version History

```

# 2. Interactive Schedule Table

Your timetable should support multiple viewing modes.

### Weekly timetable

Example:

```

Section: CSE-A

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Period   │ Monday   │ Tuesday  │ Wednesday│ Thursday │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 09-10    │ Java     │ DBMS     │ Java     │ OS       │
│ 10-11    │ DBMS     │ Java     │ OS       │ Java     │
│ 11-12    │ Break    │ Break    │ Break    │ Break    │
│ 12-01    │ OS       │ CN       │ DBMS     │ CN       │
│ 01-02    │ CN Lab   │ Java Lab │ OS Lab   │ DBMS Lab │
└──────────┴──────────┴──────────┴──────────┴──────────┘

```

Features:

- Weekly view.
- Daily view.
- Monday–Saturday configuration.
- Custom working days.
- Custom period timings.
- Custom break timings.
- Multiple timetable layouts.
- Responsive table.
- Sticky day headers.
- Sticky period column.
- Horizontal scrolling.
- Fullscreen timetable.
- Zoom table.
- Print-friendly layout.

### Advanced table customization

- Customize column widths.
- Customize row heights.
- Resize periods.
- Change table density.
- Show or hide faculty names.
- Show or hide room names.
- Show subject codes.
- Show subject credits.
- Configure cell display format.

# 3. Cell-Level Editing

Each timetable cell should behave like an interactive editor.

### Basic features

- Click cell to select.
- Double-click to edit.
- Open cell configuration panel.
- Edit subject.
- Edit faculty.
- Edit room.
- Edit period.
- Edit duration.
- Clear assignment.
- Save changes.
- Cancel changes.

### Example cell

```

┌────────────────────────────┐
│ Java Programming          │
│ Faculty: Ramesh Kumar    │
│ Room: CSE-101            │
│ Period: 09:00 - 10:00    │
└────────────────────────────┘

```

When clicking the cell:

```
Edit Schedule Cell

Subject
[Java Programming ▼]

Faculty
[Ramesh Kumar ▼]

Room
[CSE-101 ▼]

Day
[Monday ▼]

Period
[Period 1 ▼]

Duration
[1 Period ▼]

[Cancel] [Save]
```

# 4. Advanced Cell Editor

Instead of a basic form, build a dedicated cell editor with tabs.

```

Cell Configuration
│
├── General
│   ├── Subject
│   ├── Faculty
│   ├── Room
│   └── Period
│
├── Timing
│   ├── Start Time
│   ├── End Time
│   ├── Duration
│   └── Consecutive Periods
│
├── Assignment
│   ├── Section
│   ├── Faculty
│   ├── Subject
│   └── Room
│
├── Constraints
│   ├── Faculty Availability
│   ├── Room Availability
│   └── Section Availability
│
└── Validation
    ├── Conflict Status
    ├── Workload Status
    └── Room Status

```

Additional features:

- Dynamic dropdowns.
- Searchable faculty selector.
- Searchable room selector.
- Subject filtering.
- Automatic faculty suggestions.
- Automatic room suggestions.
- Inline validation.
- Unsaved changes indicator.
- Field-level error messages.

# 5. Drag & Drop Schedule Editing

This is one of the most important features.

Users should be able to move classes directly between cells.

### Drag-and-drop operations

- Move a class to another period.
- Move a class to another day.
- Move a class to another section.
- Move a class to another room.
- Swap two classes.
- Copy a class.
- Move laboratory sessions.
- Drag classes between timetable views.

### Example

```
Monday

Period 1: Java
Period 2: DBMS
Period 3: OS
```

User drags:

```
Java → Period 3
```

Result:

```
Period 1: Empty
Period 2: DBMS
Period 3: Java
```

The editor should:

1. Update the selected cell.
2. Validate the target assignment.
3. Check faculty conflicts.
4. Check room conflicts.
5. Check section conflicts.
6. Save the change.
7. Display validation feedback.

Important: Don't allow the frontend to silently accept invalid moves. The backend must validate the updated schedule before committing it.

# 6. Cell Copy, Paste & Duplicate

Features:

- Copy one cell.
- Paste into another cell.
- Duplicate schedule entry.
- Copy faculty assignment.
- Copy room assignment.
- Copy subject configuration.
- Copy an entire day.
- Copy an entire week.
- Paste into multiple selected cells.
- Clear copied content.

### Advanced

```
Copy Cell
    ↓
Select Target Cells
    ↓
Preview Changes
    ↓
Validate Assignments
    ↓
Apply Changes
```

When copying a class, distinguish between:

- Copying the complete assignment.
- Copying only the subject.
- Copying only faculty.
- Copying only room.

This prevents unintended duplicate assignments.

# 7. Cell Selection & Multi-Cell Editing

Features:

- Single-cell selection.
- Multi-cell selection.
- Select entire row.
- Select entire column.
- Select entire day.
- Select entire timetable.
- Keyboard navigation.
- Shift-click selection.
- Ctrl-click selection.
- Selection highlighting.
- Bulk editing.

### Bulk operations

```
Selected Cells: 4

Actions:
- Assign Faculty
- Assign Room
- Change Subject
- Clear Cells
- Copy
- Paste
```

Example:

Select four cells and assign the same faculty to all four.

Before applying:

- Check whether the faculty is available.
- Check whether the faculty would be double-booked.
- Check workload limits.
- Validate the selected assignments together.

# 8. Timetable Cell Types

Support different types of schedule cells.

| Cell Type     | Purpose                   |
| ------------- | ------------------------- |
| Theory        | Regular classroom lecture |
| Laboratory    | Practical session         |
| Tutorial      | Tutorial class            |
| Seminar       | Seminar session           |
| Break         | Lunch or interval         |
| Free Period   | Unallocated period        |
| Examination   | Exam schedule             |
| Special Event | Academic event            |
| Empty         | No assignment             |

### Cell behavior

Each cell type should have its own configuration.

For example:

Laboratory cell

- Laboratory room required.
- Faculty required.
- Consecutive periods required.
- Room capacity validation.

Break cell

- No faculty assignment.
- No room assignment.
- Cannot be overwritten by ordinary drag-and-drop.

Examination cell

- Examination room.
- Invigilator assignment.
- Exam duration.
- Section assignment.

# 9. Cell Merging & Splitting

For laboratory classes that occupy multiple periods, support merged cells.

Example:

```
Period 1 ┌─────────────────────┐
Period 2 │ Java Laboratory    │
Period 3 │ Faculty: Ramesh    │
         └─────────────────────┘
```

Features:

- Merge consecutive periods.
- Split merged periods.
- Configure duration.
- Move merged sessions.
- Resize merged sessions.
- Validate consecutive period availability.
- Prevent overlapping assignments.

Implementation note: Represent a laboratory as one schedule entry with a duration or set of occupied slots. Don't store separate unrelated lab assignments in each cell.

# 10. Schedule Conflict Detection

The editor should validate changes immediately.

### Faculty conflict

```
Faculty: Ramesh Kumar

Monday - Period 1
Java Programming

Monday - Period 1
Database Management

Conflict: Faculty is assigned to
two classes simultaneously.
```

### Room conflict

```
Room: CSE-101

Monday - Period 2
Java Programming

Monday - Period 2
Operating Systems

Conflict: Room is already occupied.
```

### Section conflict

```
Section: CSE-A

Monday - Period 3
Data Structures

Monday - Period 3
Computer Networks

Conflict: Section has overlapping classes.
```

### Advanced validation

- Faculty availability.
- Faculty workload.
- Room capacity.
- Room equipment.
- Laboratory duration.
- Break restrictions.
- Subject weekly hours.
- Maximum consecutive periods.
- Minimum rest periods.
- Section availability.
- Academic calendar restrictions.

# 11. Smart Cell Suggestions

When a user selects a cell, automatically suggest compatible assignments.

### Example

```
Selected Slot

Monday
Period 3
Section CSE-A

Recommended Subjects:

1. Data Structures
2. Computer Networks
3. Operating Systems
```

For each subject, recommend:

- Available faculty.
- Available rooms.
- Compatible laboratories.
- Suitable periods.
- Workload-compatible assignments.

### Smart recommendations

- Suggest faculty with matching qualifications.
- Suggest available classrooms.
- Suggest alternative periods.
- Suggest alternative rooms.
- Suggest conflict-free assignments.
- Suggest workload balancing.
- Suggest suitable consecutive periods.

Recommendations should be based on real scheduling data and hard constraints, not just AI-generated guesses.

# 12. Timetable Editing History

Every important schedule change should be tracked.

### Features

- Undo cell changes.
- Redo cell changes.
- Track previous assignments.
- Track current assignments.
- Record who modified the timetable.
- Record modification timestamps.
- Restore previous timetable versions.
- Compare timetable revisions.
- View edit history.

Example:

```
Schedule History

10:30 AM
Java moved from Period 1 to Period 3.

10:32 AM
Room changed from CSE-101 to CSE-102.

10:35 AM
Faculty changed from Faculty A to Faculty B.
```

For concurrent editing, use optimistic concurrency control so one user's changes don't silently overwrite another user's updates.

# 13. Auto-Save & Manual Save

Features:

- Auto-save after cell changes.
- Manual save button.
- Save indicator.
- Unsaved changes indicator.
- Save error handling.
- Retry failed saves.
- Restore last saved version.
- Save schedule revisions.
- Save only modified cells.

### Recommended save flow

```
User Edits Cell
      │
      ▼
Update Local Editor State
      │
      ▼
Validate Cell
      │
      ▼
Debounced Save
      │
      ▼
Backend Validation
      │
      ▼
Database Transaction
      │
      ▼
Save Successful
      │
      ▼
Update Save Status
```

For important operations like moving a laboratory session or changing multiple cells, save the entire operation atomically.

# 14. Keyboard Shortcuts

Support fast editing.

| Shortcut        | Action               |
| --------------- | -------------------- |
| `Enter`         | Edit selected cell   |
| `Escape`        | Cancel editing       |
| `Delete`        | Clear selected cell  |
| `Ctrl + C`      | Copy cell            |
| `Ctrl + V`      | Paste cell           |
| `Ctrl + Z`      | Undo                 |
| `Ctrl + Y`      | Redo                 |
| `Arrow Keys`    | Navigate cells       |
| `Shift + Arrow` | Extend selection     |
| `Ctrl + S`      | Save timetable       |
| `Ctrl + D`      | Duplicate assignment |

Shortcuts should not interfere with text inputs. When a user is typing in a cell editor, normal text-editing shortcuts must take priority.

# 15. Schedule Table Customization

Features:

- Add custom periods.
- Remove periods.
- Change period duration.
- Configure start and end time.
- Add breaks.
- Configure lunch time.
- Configure working days.
- Configure Saturday schedule.
- Configure department-specific timings.
- Configure section-specific schedules.

Example:

```
Period Configuration

Period 1
09:00 AM - 10:00 AM

Period 2
10:00 AM - 11:00 AM

Break
11:00 AM - 11:15 AM

Period 3
11:15 AM - 12:15 PM
```

When periods change, the editor should detect assignments that no longer fit the timetable.

# 16. Schedule Locking & Permissions

Features:

- Lock individual cells.
- Lock entire rows.
- Lock entire days.
- Lock entire timetable.
- Read-only mode.
- Faculty editing permissions.
- Designer editing permissions.
- Admin override.
- Published timetable protection.

### Example

```
Timetable Status: Published

Editing:
Disabled

Available Actions:
- View
- Export PDF
- Export Excel

Admin:
- Unlock Timetable
- Create New Revision
```

Published schedules should be immutable revisions. Editing a published schedule should create a draft revision rather than silently changing the published timetable.

# 17. Schedule Comparison

Allow users to compare two timetable versions.

Features:

- Compare timetable revisions.
- Highlight changed cells.
- Highlight added classes.
- Highlight removed classes.
- Highlight changed faculty.
- Highlight changed rooms.
- Compare workload.
- Compare conflicts.
- Restore previous version.

Example:

```
Timetable Comparison

Monday - Period 3

Previous:
Data Structures
Faculty A
Room CSE-101

Current:
Computer Networks
Faculty B
Room CSE-102

Changes:
Subject changed
Faculty changed
Room changed
```

# 18. Timetable Publishing Workflow

Your editor should have a clear lifecycle.

```
Draft
  │
  ▼
Editing
  │
  ▼
Validation
  │
  ▼
Conflict Review
  │
  ▼
Approval
  │
  ▼
Published
  │
  ▼
Archived
```

Features:

- Save as draft.
- Validate schedule.
- Submit for approval.
- Approve timetable.
- Reject timetable.
- Publish timetable.
- Notify faculty.
- Notify students.
- Archive timetable.

Publishing should be blocked when hard scheduling conflicts exist.

# 19. AI-Assisted Schedule Editing

This can be one of the standout features.

Allow users to request schedule changes using natural language.

Example:

```
User:

Move Java Programming to Wednesday
Period 3 for CSE-A.
```

AI-assisted workflow:

```
Natural Language Request
        │
        ▼
Parse Scheduling Intent
        │
        ▼
Identify Target Assignment
        │
        ▼
Find Suitable Slot
        │
        ▼
Validate Constraints
        │
        ▼
Show Proposed Change
        │
        ▼
User Confirms
        │
        ▼
Apply Schedule Update
```

### AI editing features

- Move class.
- Change faculty.
- Change classroom.
- Find free period.
- Resolve conflicts.
- Suggest alternative slots.
- Optimize faculty workload.
- Explain scheduling conflicts.
- Generate change summaries.

Important: AI should propose structured schedule operations. The scheduling engine must validate them before applying.

# 20. Timetable Editor API

Recommended API structure:

### Retrieve timetable

```
GET /api/v1/timetables/:timetableId
```

### Update a cell

```
PATCH /api/v1/timetables/:timetableId/slots/:slotId
```

Request:

```
{
  "subjectId": "subject-123",
  "facultyId": "faculty-456",
  "roomId": "room-789"
}
```

### Move schedule entry

```
POST /api/v1/timetables/:timetableId/entries/:entryId/move
```

Request:

```
{
  "targetDay": "WEDNESDAY",
  "targetPeriodId": "period-3"
}
```

### Swap schedule entries

```
POST /api/v1/timetables/:timetableId/entries/swap
```

### Validate timetable

```
POST /api/v1/timetables/:timetableId/validate
```

### Clear cell

```
DELETE /api/v1/timetables/:timetableId/slots/:slotId
```

### Undo / redo

```
POST /api/v1/timetables/:timetableId/undo
POST /api/v1/timetables/:timetableId/redo
```

### Publish

```
POST /api/v1/timetables/:timetableId/publish
```

These are proposed routes. For operations involving multiple cells, define transactional validation and explicit conflict responses.

# 21. Recommended Frontend Structure

```
src/
└── modules/
    └── timetable-editor/
        │
        ├── components/
        │   ├── timetable-grid/
        │   ├── timetable-cell/
        │   ├── cell-editor/
        │   ├── schedule-toolbar/
        │   ├── period-header/
        │   ├── day-header/
        │   ├── conflict-indicator/
        │   ├── schedule-sidebar/
        │   └── schedule-preview/
        │
        ├── hooks/
        │   ├── use-timetable-editor/
        │   ├── use-cell-editing/
        │   ├── use-schedule-drag-drop/
        │   ├── use-schedule-validation/
        │   └── use-schedule-history/
        │
        ├── services/
        │   └── timetable-editor.service.ts
        │
        ├── stores/
        │   └── timetable-editor.store.ts
        │
        ├── schemas/
        │   └── timetable-editor.schema.ts
        │
        └── utils/
            ├── schedule-conflict.ts
            ├── schedule-validation.ts
            └── schedule-operations.ts
```

# 22. Best Features to Implement First

| Priority | Feature                               |
| -------- | ------------------------------------- |
| P0       | Interactive timetable grid            |
| P0       | Cell selection and editing            |
| P0       | Faculty, subject, and room assignment |
| P0       | Drag-and-drop                         |
| P0       | Conflict validation                   |
| P0       | Auto-save                             |
| P1       | Copy, paste, duplicate                |
| P1       | Multi-cell selection                  |
| P1       | Undo and redo                         |
| P1       | Period configuration                  |
| P1       | Laboratory merging                    |
| P1       | Schedule history                      |
| P1       | Locking and permissions               |
| P2       | Schedule comparison                   |
| P2       | AI-assisted editing                   |
| P2       | Advanced optimization                 |

## My recommendation

Build your Schedule Editor around these five systems:

1. Grid Engine: Rows, columns, periods, days, cell rendering, responsive layout.
2. Cell Editor: Subject, faculty, room, duration, and configuration.
3. Schedule Operations: Move, swap, copy, paste, clear, merge, and split.
4. Validation Engine: Faculty, room, section, workload, and timing constraints.
5. History & Persistence: Auto-save, undo/redo, revisions, and publishing.

The most important advanced feature is transactional drag-and-drop with conflict detection: users should be able to move or swap classes quickly, see validation results immediately, and save only valid schedule changes.