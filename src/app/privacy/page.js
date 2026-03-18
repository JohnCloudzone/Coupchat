'use client';

export default function PrivacyPolicyPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a, #1a1a3e)',
            color: '#e0e0e0',
            padding: '40px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
                    Privacy Policy
                </h1>
                <p style={{ color: '#888', marginBottom: '32px' }}>Last updated: March 18, 2026</p>

                <Section title="1. Introduction">
                    <p>Welcome to CoupChat ("we", "us", "our"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our application.</p>
                </Section>

                <Section title="2. Information We Collect">
                    <p><strong>Account Information:</strong> When you register, we collect your email address, display name, and profile picture (if provided via Google OAuth).</p>
                    <p><strong>Guest Users:</strong> For guest users, we generate a random identifier stored locally on your device. No personal information is required.</p>
                    <p><strong>Chat Messages:</strong> Messages sent in public rooms are stored to provide chat history. Direct messages are stored to enable conversation continuity.</p>
                    <p><strong>Usage Data:</strong> We may collect basic analytics data such as pages visited, features used, and session duration to improve our service.</p>
                </Section>

                <Section title="3. How We Use Your Information">
                    <p>We use your information to:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                        <li>Provide and maintain the chat service</li>
                        <li>Enable real-time communication features</li>
                        <li>Display your profile to other users</li>
                        <li>Improve and optimize the application</li>
                        <li>Prevent abuse and ensure safety</li>
                    </ul>
                </Section>

                <Section title="4. Data Storage & Security">
                    <p>Your data is stored securely using Supabase (built on PostgreSQL with Row Level Security). We use industry-standard encryption for data in transit (HTTPS/TLS).</p>
                    <p>Profile images are stored in secure cloud storage with public read access for display purposes.</p>
                </Section>

                <Section title="5. Third-Party Services">
                    <p>We use the following third-party services:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                        <li><strong>Supabase:</strong> Authentication and database services</li>
                        <li><strong>Google OAuth:</strong> Optional sign-in via Google account</li>
                        <li><strong>Google AdSense:</strong> Advertising services</li>
                    </ul>
                </Section>

                <Section title="6. Your Rights">
                    <p>You have the right to:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                        <li>Access your personal data</li>
                        <li>Update or correct your profile information</li>
                        <li>Delete your account and associated data</li>
                        <li>Opt out of non-essential data collection</li>
                    </ul>
                </Section>

                <Section title="7. Children's Privacy">
                    <p>CoupChat is intended for users aged 18 and above. We do not knowingly collect personal information from children under 18. Age verification is required to access certain features.</p>
                </Section>

                <Section title="8. Changes to This Policy">
                    <p>We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new policy on this page with an updated date.</p>
                </Section>

                <Section title="9. Contact Us">
                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                    <p style={{ color: '#8b5cf6', fontWeight: 'bold' }}>support@coupchat.in</p>
                </Section>

                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333', textAlign: 'center' }}>
                    <a href="/" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 'bold' }}>← Back to CoupChat</a>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#c4b5fd', marginBottom: '12px' }}>{title}</h2>
            <div style={{ lineHeight: '1.8', color: '#ccc' }}>{children}</div>
        </section>
    );
}
