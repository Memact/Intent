export const SENSITIVE_KEYWORDS = [
  'religion', 'christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'atheist',
  'sexuality', 'gay', 'lesbian', 'bisexual', 'transgender', 'queer', 'heterosexual',
  'medical condition', 'diagnosis', 'symptom', 'disease', 'illness', 'prescription', 'cancer',
  'political party', 'republican', 'democrat', 'liberal', 'conservative', 'socialist',
  'financial status', 'bankruptcy', 'debt', 'salary', 'net worth', 'foreclosure',
  'mental health', 'depression', 'anxiety', 'suicide', 'therapy', 'psychiatrist', 'bipolar',
  'pregnant', 'abortion', 'contraceptive', 'fertility'
];

function sensitiveSearchText(activity) {
  return [activity.label, activity.text, activity.url]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function findSensitiveKeyword(activity) {
  const text = sensitiveSearchText(activity);
  return SENSITIVE_KEYWORDS.find(keyword => text.includes(keyword.toLowerCase())) || null;
}

export function isSensitiveActivity(activity) {
  return Boolean(findSensitiveKeyword(activity));
}

export function findSensitiveSignals(activities) {
  const found = [];

  for (let index = 0; index < activities.length; index++) {
    const activity = activities[index];
    const keyword = findSensitiveKeyword(activity);

    if (keyword) {
      found.push({
        type: 'sensitive_signal_skipped',
        reason: 'Sensitive content was not used for intent prediction.',
        keyword,
        source_id: activity.id || `activity:${index}`,
        activity_label: activity.label || ''
      });
    }
  }

  return found;
}

export const INTENT_RULES = [
  {
    id: 'intent:dev_integration',
    label: 'User is likely integrating Memact into an app',
    category: 'dev:code',
    baseConfidence: 0.10,
    signals: {
      keywords: ['api', 'integration', 'sdk', 'developer', 'auth', 'token', 'curl', 'endpoint'],
      typeMatches: ['app_created', 'permissions_saved', 'api_key_created', 'api_key_tested', 'tested_key', 'api_docs_viewed', 'connect_tutorial_opened'],
      categoryMatches: ['dev:code'],
      urlPatterns: ['/access', '/learn', '/docs', '/api'],
      domainMatches: ['memact.com']
    },
    sequences: [
      ['api_key_created', 'api_key_tested'],
      ['api_key_created', 'tested_key'],
      ['app_created', 'api_key_created'],
      ['connect_tutorial_opened', 'api_key_created']
    ],
    alternativeIntents: [
      { id: 'intent:dashboard_testing', label: 'Testing dashboard UX', confidence: 0.42 },
      { id: 'intent:app_setup_review', label: 'Reviewing app setup', confidence: 0.38 },
      { id: 'intent:debug_auth_flow', label: 'Debugging auth/API flow', confidence: 0.35 }
    ],
    allowedActions: [
      'Show API verification command',
      'Offer integration checklist',
      'Suggest backend terminal test',
      'Link consent and Data Transparency flow'
    ],
    blockedActions: [
      'Auto-enable permissions',
      'Expose raw graph',
      'Share inferred intent with unrelated apps',
      'Store private API key client-side'
    ]
  },
  {
    id: 'intent:permission_review',
    label: 'User is reviewing or changing app permissions',
    category: 'access:permissions',
    baseConfidence: 0.10,
    signals: {
      keywords: ['consent', 'permission', 'scope', 'data transparency', 'revoke'],
      typeMatches: ['consent_opened', 'data_transparency_opened', 'scopes_viewed', 'categories_changed', 'consent_revoked'],
      categoryMatches: ['access:permissions'],
      urlPatterns: ['/access', '/consent', '/data-transparency', '/permissions'],
      domainMatches: ['memact.com']
    },
    sequences: [
      ['consent_opened', 'scopes_viewed'],
      ['data_transparency_opened', 'categories_changed'],
      ['scopes_viewed', 'categories_changed']
    ],
    alternativeIntents: [
      { id: 'intent:account_settings', label: 'Adjusting account settings', confidence: 0.40 },
      { id: 'intent:security_audit', label: 'Running a security audit', confidence: 0.35 },
      { id: 'intent:privacy_check', label: 'Checking privacy configuration', confidence: 0.32 }
    ],
    allowedActions: [
      'Show permission summary',
      'Explain what each scope allows',
      'Offer revoke/edit controls'
    ],
    blockedActions: [
      'Hide evidence fields',
      'Nudge user toward broader permissions',
      'Preselect risky scopes without explanation'
    ]
  },
  {
    id: 'intent:shopping_comparison',
    label: 'User is comparing products before a purchase',
    category: 'web:commerce',
    baseConfidence: 0.10,
    signals: {
      keywords: ['price', 'product', 'review', 'compare', 'vs', 'versus', 'cart', 'wishlist', 'buy', 'purchase', 'brand', 'model'],
      typeMatches: ['product_page', 'review_page', 'price_comparison', 'cart', 'wishlist'],
      categoryMatches: ['web:commerce'],
      urlPatterns: ['/product', '/review', '/cart', '/compare', '/pricing'],
      domainMatches: []
    },
    sequences: [
      ['product_page', 'price_comparison'],
      ['product_page', 'review_page'],
      ['product_page', 'cart']
    ],
    alternativeIntents: [
      { id: 'intent:product_research', label: 'Researching product specifications', confidence: 0.40 },
      { id: 'intent:window_shopping', label: 'Browsing without purchase intent', confidence: 0.32 },
      { id: 'intent:price_tracking', label: 'Tracking price changes', confidence: 0.28 }
    ],
    allowedActions: [
      'Summarize comparison criteria',
      'Show saved alternatives',
      'Ask user to confirm budget/priority'
    ],
    blockedActions: [
      'Auto-purchase',
      'Create urgency pressure',
      'Manipulate with scarcity framing',
      'Share purchase intent with advertisers'
    ]
  },
  {
    id: 'intent:research_learning',
    label: 'User is learning or researching a topic',
    category: 'web:research',
    baseConfidence: 0.10,
    signals: {
      keywords: ['how to', 'explain', 'guide', 'paper', 'tutorial', 'documentation', 'learn', 'reference', 'docs', 'introduction', 'what is'],
      typeMatches: ['documentation_page', 'tutorial', 'article', 'paper', 'note'],
      categoryMatches: ['web:research'],
      urlPatterns: ['/docs', '/learn', '/tutorial', '/guide', '/wiki', '/reference'],
      domainMatches: []
    },
    sequences: [
      ['documentation_page', 'tutorial'],
      ['tutorial', 'note'],
      ['documentation_page', 'article'],
      ['article', 'note']
    ],
    alternativeIntents: [
      { id: 'intent:task_completion', label: 'Completing a specific task', confidence: 0.38 },
      { id: 'intent:problem_solving', label: 'Troubleshooting a problem', confidence: 0.35 },
      { id: 'intent:curiosity_browsing', label: 'Casual browsing of topics', confidence: 0.28 }
    ],
    allowedActions: [
      'Build learning summary',
      'Suggest concept map',
      'Show unresolved questions'
    ],
    blockedActions: [
      'Pretend full understanding from one page',
      'Hide source uncertainty',
      'Recommend unrelated commercial content'
    ]
  },
  {
    id: 'intent:content_sharing_or_reply',
    label: 'User may be preparing to share, reply, or respond to content',
    category: 'web:social',
    baseConfidence: 0.10,
    signals: {
      keywords: ['share', 'reply', 'comment', 'post', 'thread', 'retweet', 'community', 'repost', 'submit', 'discuss'],
      typeMatches: ['social_post', 'reply', 'share', 'comment', 'thread_view'],
      categoryMatches: ['web:social'],
      urlPatterns: ['/post', '/thread', '/comment', '/share', '/reply'],
      domainMatches: []
    },
    sequences: [
      ['social_post', 'reply'],
      ['social_post', 'share'],
      ['thread_view', 'reply']
    ],
    alternativeIntents: [
      { id: 'intent:content_consumption', label: 'Consuming social content passively', confidence: 0.35 },
      { id: 'intent:community_engagement', label: 'Engaging with a community', confidence: 0.30 },
      { id: 'intent:information_dissemination', label: 'Sharing information with others', confidence: 0.28 }
    ],
    allowedActions: [
      'Offer context check',
      'Summarize public thread',
      'Highlight framing/evidence'
    ],
    blockedActions: [
      'Generate manipulative replies',
      'Escalate outrage',
      'Target political persuasion',
      'Infer sensitive traits from social behavior'
    ]
  }
];
