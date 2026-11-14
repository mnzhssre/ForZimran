
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Page =
  | 'home'
  | 'jury'
  | 'demo'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'travel'
  | 'friends'
  | 'chat';

const names = [
  'Alex','Jordan','Taylor','Morgan','Casey','Jamie','Riley',
  'Avery','Parker','Quinn','Drew','Sam','Cameron','Reese',
  'Skyler','Charlie','Dakota','Rowan','Finley','Emerson',
  'Harper','Kai','Sage','Blake','Hayden','Logan','Robin',
  'Kendall','Jesse','Shawn','Bailey','Micah','Sydney','Arden',
  'Ellis','Remy','Frankie','Milan','Ari','Noel','Marley',
  'Jules','Tatum','Lennon','River','Phoenix','Shiloh',
  'Lane','Eden','Indigo'
];

const interests = [
  'Travel','Coffee','Hiking','Movies','Museums',
  'Food','Music','Art','Fitness','Board games'
];

const people = names.map((name, i) => ({
  id: i + 1,
  name,
  age: 25 + i % 21,
  city: i % 5 === 0 ? 'Brooklyn' : 'New York',
  interest: interests[i % interests.length]
}));

const initialTravel = {
  destination: '',
  dateType: 'Exact dates',
  start: '',
  end: '',
  month: '',
  duration: '',
  min: '',
  max: '',
  budgetBasis: 'Per person',
  payment: 'Everyone pays their own way',
  comfort: 'Standard',
  hotel: '3–4 stars',
  flight: 'Economy',
  transport: 'Public transport / rideshare',
  dining: 'Casual dining',
  company: 'One person',
  visibility: 'Friends only',
  notes: ''
};

export default function Home() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [inclusivity, setInclusivity] =
    useState('Prefer not to answer');

  const [requests, setRequests] = useState<number[]>([]);
  const [messages, setMessages] = useState([
    {
      text: 'Hi! Want to plan something this weekend?',
      own: false
    }
  ]);
  const [msg, setMsg] = useState('');
  const [travel, setTravel] = useState(initialTravel);
  const [tripSaved, setTripSaved] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (!error && data.session?.user) {
        const account = data.session.user;
        setUser(
          account.user_metadata?.full_name ||
          account.email ||
          'Member'
        );
        setDemoMode(false);
        setPage('dashboard');
      }

      setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active || !session?.user) return;

        const account = session.user;
        setUser(
          account.user_metadata?.full_name ||
          account.email ||
          'Member'
        );
        setDemoMode(false);
        setPage('dashboard');
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const nav = (next: Page) => {
    setAuthMessage('');
    setAuthError('');
    setPage(next);
    window.scrollTo(0, 0);
  };

  const change = (
    key: keyof typeof initialTravel,
    value: string
  ) => {
    setTravel(previous => ({
      ...previous,
      [key]: value
    }));
    setTripSaved(false);
  };

  const loginDemo = (role: string) => {
    setUser(role);
    setDemoMode(true);
    nav('dashboard');
  };

  const signUp = async () => {
    setAuthError('');
    setAuthMessage('');

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !birthDate
    ) {
      setAuthError('Please complete all required fields.');
      return;
    }

    if (password.length < 8) {
      setAuthError(
        'Use a password with at least 8 characters.'
      );
      return;
    }

    const birthday = new Date(birthDate + 'T00:00:00');
    const today = new Date();

    let age =
      today.getFullYear() - birthday.getFullYear();

    const birthdayPassed =
      today.getMonth() > birthday.getMonth() ||
      (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() >= birthday.getDate()
      );

    if (!birthdayPassed) age--;

    if (
      Number.isNaN(birthday.getTime()) ||
      age < 18
    ) {
      setAuthError(
        'You must be at least 18 to join BothFree.'
      );
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim(),
              date_of_birth: birthDate,
              gender,
              inclusivity_preference: inclusivity
            }
          }
        });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setPassword('');

      if (data.session) {
        setAuthMessage(
          'Account created successfully.'
        );
      } else {
        setAuthMessage(
          'Check your email for a confirmation link. ' +
          'After confirming, return to BothFree and log in.'
        );
      }
    } catch {
      setAuthError(
        'Unable to connect. Please try again.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const logIn = async () => {
    setAuthError('');
    setAuthMessage('');

    if (!email.trim() || !password) {
      setAuthError(
        'Please enter your email and password.'
      );
      return;
    }

    setAuthLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setPassword('');
    } catch {
      setAuthError(
        'Unable to connect. Please try again.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const logOut = async () => {
    if (!demoMode) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthError(error.message);
        return;
      }
    }

    setUser('');
    setDemoMode(false);
    setEmail('');
    setPassword('');
    nav('home');
  };

  const field = (
    label: string,
    key: keyof typeof initialTravel,
    options?: string[]
  ) => (
    <label className="field">
      {label}
      {options ? (
        <select
          value={travel[key]}
          onChange={event =>
            change(key, event.target.value)
          }
        >
          {options.map(option => (
            <option key={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={travel[key]}
          onChange={event =>
            change(key, event.target.value)
          }
          type={
            key === 'start' || key === 'end'
              ? 'date'
              : key === 'min' || key === 'max'
                ? 'number'
                : 'text'
          }
        />
      )}
    </label>
  );

  return (
    <>
      <header>
        <div
          className="brand"
          onClick={() => nav('home')}
          style={{ cursor: 'pointer' }}
        >
          both<span>free.</span>
        </div>
        <span className="pill">
          MAKE REAL PLANS
        </span>
      </header>

      <main className="wrap">
        {authChecking && (
          <div className="notice">
            Checking your account...
          </div>
        )}

        {page === 'home' && (
          <>
            <section className="hero">
              <div className="eyebrow">
                FIND YOUR PEOPLE · MAKE REAL PLANS
              </div>
              <h1>
                Less planning.
                <br />
                <span className="accent">
                  More living.
                </span>
              </h1>
              <p>
                Find friends, explore experiences,
                and turn “we should meet” into
                an actual plan.
              </p>
            </section>

            <div className="grid">
              {([
                [
                  'Jury Access',
                  'Explore the guided judging experience.',
                  'jury'
                ],
                [
                  'Explore as User',
                  'Try a safe, fictional demo experience.',
                  'demo'
                ],
                [
                  'Log In',
                  'Access your existing account.',
                  'login'
                ],
                [
                  'Sign Up',
                  'Create your own BothFree account.',
                  'signup'
                ]
              ] as [string, string, Page][]).map(
                ([title, description, destination]) => (
                  <div
                    className="card"
                    key={title}
                  >
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <button
                      className="btn"
                      onClick={() =>
                        nav(destination)
                      }
                    >
                      Continue →
                    </button>
                  </div>
                )
              )}
            </div>

            <div className="divider" />

            <h2>
              From shared interests to shared moments.
            </h2>

            <div className="grid">
              {[
                'Invite someone I know',
                'Find a new friend',
                'Find a date',
                'Travel together'
              ].map(title => (
                <div
                  className="card"
                  key={title}
                >
                  <h3>{title}</h3>
                  <p>
                    Plan with clarity, comfort,
                    and mutual consent.
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {(page === 'jury' || page === 'demo') && (
          <div className="card panel">
            <div className="eyebrow">
              {page === 'jury'
                ? 'JURY DEMO'
                : 'USER DEMO'}
            </div>

            <h2>Explore BothFree</h2>

            <p>
              This is a fictional demo environment.
              No real users or messages are represented.
            </p>

            <button
              className="btn"
              onClick={() =>
                loginDemo(
                  page === 'jury'
                    ? 'Jury Reviewer'
                    : 'Demo User'
                )
              }
            >
              Enter demo →
            </button>

            <button
              className="btn ghost"
              style={{ marginLeft: 10 }}
              onClick={() => nav('home')}
            >
              Back
            </button>
          </div>
        )}

        {(page === 'login' || page === 'signup') && (
          <div className="card panel">
            <h2>
              {page === 'login'
                ? 'Log in'
                : 'Create an account'}
            </h2>

            {authError && (
              <div
                className="notice"
                role="alert"
              >
                {authError}
              </div>
            )}

            {authMessage && (
              <div
                className="notice"
                role="status"
              >
                {authMessage}
              </div>
            )}

            <form
              onSubmit={event => {
                event.preventDefault();

                if (authLoading) return;

                if (page === 'login') {
                  void logIn();
                } else {
                  void signUp();
                }
              }}
            >
              <label className="field">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={event =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label className="field">
                Password
                <input
                  type="password"
                  autoComplete={
                    page === 'signup'
                      ? 'new-password'
                      : 'current-password'
                  }
                  minLength={
                    page === 'signup'
                      ? 8
                      : undefined
                  }
                  required
                  value={password}
                  onChange={event =>
                    setPassword(event.target.value)
                  }
                  placeholder="Password"
                />
              </label>

              {page === 'signup' && (
                <>
                  <label className="field">
                    Full name
                    <input
                      required
                      value={fullName}
                      onChange={event =>
                        setFullName(event.target.value)
                      }
                      placeholder="Your name"
                    />
                  </label>

                  <label className="field">
                    Date of birth
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={event =>
                        setBirthDate(event.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    Gender
                    <select
                      value={gender}
                      onChange={event =>
                        setGender(event.target.value)
                      }
                    >
                      <option>
                        Prefer not to say
                      </option>
                      <option>Woman</option>
                      <option>Man</option>
                      <option>Non-binary</option>
                      <option>Self-describe</option>
                    </select>
                  </label>

                  <label className="field">
                    Community inclusivity preferences (optional)
                    <select
                      value={inclusivity}
                      onChange={event =>
                        setInclusivity(event.target.value)
                      }
                    >
                      <option>
                        Prefer not to answer
                      </option>
                      <option>
                        I'm comfortable connecting with people of all LGBTQ+ identities
                      </option>
                      <option>
                        I prefer to keep this private
                      </option>
                    </select>
                  </label>
                </>
              )}

              <button
                className="btn"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : page === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>

            <p className="small">
              {page === 'login'
                ? 'New to BothFree? '
                : 'Already have an account? '}

              <button
                className="btn ghost"
                onClick={() =>
                  nav(
                    page === 'login'
                      ? 'signup'
                      : 'login'
                  )
                }
              >
                {page === 'login'
                  ? 'Sign up'
                  : 'Log in'}
              </button>
            </p>

            <p className="small">
              Want to explore now?{' '}
              <button
                className="btn ghost"
                onClick={() => nav('demo')}
              >
                Try demo
              </button>
            </p>
          </div>
        )}

        {(
          [
            'dashboard',
            'travel',
            'friends',
            'chat'
          ] as Page[]
        ).includes(page) && (
          <>
            <div
              className="row"
              style={{
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div className="eyebrow">
                  WELCOME, {user.toUpperCase()}
                </div>
                <h2>
                  Make something happen.
                </h2>
              </div>

              <button
                className="btn ghost"
                onClick={() =>
                  void logOut()
                }
              >
                {demoMode
                  ? 'Exit demo'
                  : 'Log out'}
              </button>
            </div>

            <div className="notice">
              {demoMode
                ? 'Demo mode · Fictional profiles · Changes are temporary.'
                : 'Signed in · Your account is authenticated. Social features below are currently demo previews.'}
            </div>

            <div className="nav">
              {([
                ['dashboard', 'Dashboard'],
                ['travel', 'Travel'],
                ['friends', 'Friends'],
                ['chat', 'Messages']
              ] as [Page, string][]).map(
                ([destination, label]) => (
                  <button
                    key={destination}
                    className={
                      'chip ' +
                      (
                        page === destination
                          ? 'selected'
                          : ''
                      )
                    }
                    onClick={() =>
                      nav(destination)
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </>
        )}

        {page === 'dashboard' && (
          <div className="grid">
            {[
              [
                'Invite someone I know',
                'Plan a get-together.'
              ],
              [
                'Find a new friend',
                'Discover shared interests.'
              ],
              [
                'Find a date',
                'Meet with mutual interest.'
              ],
              [
                'Travel together',
                'Match dates, budgets and travel styles.'
              ]
            ].map(
              ([title, description], index) => (
                <div
                  className="card"
                  key={title}
                >
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <button
                    className="btn"
                    onClick={() =>
                      nav(
                        index === 3
                          ? 'travel'
                          : 'friends'
                      )
                    }
                  >
                    Explore →
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {page === 'travel' && (
          <div className="card panel">
            <div className="eyebrow">
              TRAVEL TOGETHER
            </div>

            <h2>
              Plan your next adventure
            </h2>

            <p>
              Choose what works for you.
              Your preferences can help find
              compatible travel partners.
            </p>

            {field(
              'Destination',
              'destination'
            )}

            {field(
              'Travel dates',
              'dateType',
              [
                'Exact dates',
                'Flexible dates',
                'Not sure yet'
              ]
            )}

            {travel.dateType === 'Exact dates' ? (
              <div className="grid">
                {field(
                  'Departure date',
                  'start'
                )}
                {field(
                  'Return date',
                  'end'
                )}
              </div>
            ) : travel.dateType === 'Flexible dates' ? (
              <>
                {field(
                  'Preferred month or period',
                  'month'
                )}
                {field(
                  'Trip duration (e.g. 3–5 days)',
                  'duration'
                )}
              </>
            ) : null}

            <div className="grid">
              {field(
                'Minimum budget (USD)',
                'min'
              )}
              {field(
                'Maximum budget (USD)',
                'max'
              )}
            </div>

            {field(
              'Budget applies to',
              'budgetBasis',
              [
                'Per person',
                'Entire group'
              ]
            )}

            {field(
              'How will expenses be handled?',
              'payment',
              [
                'Everyone pays their own way',
                "I'll cover the expenses",
                'Split shared expenses equally',
                "Let's discuss"
              ]
            )}

            {field(
              'Overall comfort level',
              'comfort',
              [
                'Budget',
                'Standard',
                'Premium',
                'Luxury',
                'Flexible'
              ]
            )}

            {field(
              'Accommodation',
              'hotel',
              [
                'Hostels / budget stays',
                '2–3 stars',
                '3–4 stars',
                '4–5 stars',
                '5 stars',
                'Flexible'
              ]
            )}

            {field(
              'Flight class',
              'flight',
              [
                'Economy',
                'Premium economy',
                'Business',
                'First',
                'Flexible'
              ]
            )}

            {field(
              'Local transportation',
              'transport',
              [
                'Public transport / rideshare',
                'Rental car',
                'Private driver',
                'Flexible'
              ]
            )}

            {field(
              'Dining preference',
              'dining',
              [
                'Budget-friendly',
                'Casual dining',
                'Fine dining',
                'Flexible'
              ]
            )}

            {field(
              'Travel companions',
              'company',
              [
                'One person',
                'Small group',
                'Friends',
                'A date'
              ]
            )}

            {field(
              'Who can see this plan?',
              'visibility',
              [
                'Private',
                'Friends only',
                'Public'
              ]
            )}

            <label className="field">
              Additional comments
              <textarea
                value={travel.notes}
                onChange={event =>
                  change(
                    'notes',
                    event.target.value
                  )
                }
                placeholder="What kind of trip are you hoping for?"
              />
            </label>

            <button
              className="btn"
              disabled={
                !travel.destination.trim()
              }
              onClick={() =>
                setTripSaved(true)
              }
            >
              Save demo travel plan
            </button>

            {tripSaved && (
              <div className="notice">
                Saved for this demo session:
                {' '}
                {travel.destination}.
                No booking, matching,
                or payment has been made.
              </div>
            )}
          </div>
        )}

        {page === 'friends' && (
          <>
            <h2>Discover people</h2>

            <p>
              50 fictional profiles for demonstration.
              Sending requests below changes
              only the local demo state.
            </p>

            <div className="grid">
              {people.map(person => (
                <div
                  className="card"
                  key={person.id}
                >
                  <div className="eyebrow">
                    DEMO PROFILE
                  </div>

                  <h3>
                    {person.name},
                    {' '}
                    {person.age}
                  </h3>

                  <p>
                    {person.city}
                    {' · '}
                    {person.interest}
                  </p>

                  <button
                    className="btn"
                    disabled={
                      requests.includes(
                        person.id
                      )
                    }
                    onClick={() =>
                      setRequests(previous =>
                        previous.includes(
                          person.id
                        )
                          ? previous
                          : [
                              ...previous,
                              person.id
                            ]
                      )
                    }
                  >
                    {requests.includes(
                      person.id
                    )
                      ? 'Request sent'
                      : 'Add friend'}
                  </button>
                </div>
              ))}
            </div>

            <div className="divider" />

            <p className="small">
              Friend requests here are fictional.
              Real private friend lists
              require database access policies.
            </p>
          </>
        )}

        {page === 'chat' && (
          <div className="card panel">
            <h2>
              Messages · Demo
            </h2>

            <p>
              Illustrative local conversation.
              Real-time messaging requires
              a configured backend and permissions.
            </p>

            {messages.map(
              (message, index) => (
                <div
                  key={index}
                  className={
                    'bubble ' +
                    (
                      message.own
                        ? 'right'
                        : ''
                    )
                  }
                >
                  {message.text}
                </div>
              )
            )}

            <div className="row">
              <input
                style={{
                  flex: 1,
                  minWidth: 150,
                  background: '#0b0e23',
                  color: 'white',
                  padding: 12,
                  border: '1px solid #484967',
                  borderRadius: 10
                }}
                placeholder="Type a message..."
                value={msg}
                onChange={event =>
                  setMsg(event.target.value)
                }
              />

              <button
                className="btn"
                onClick={() => {
                  if (!msg.trim()) return;

                  setMessages(previous => [
                    ...previous,
                    {
                      text: msg.trim(),
                      own: true
                    }
                  ]);

                  setMsg('');
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      <footer>
        BothFree · Demo prototype ·
        All people and activities shown
        are fictional.
      </footer>
    </>
  );
}
