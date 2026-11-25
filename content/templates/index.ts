/*
 * Complaint templates. Text is filled in the browser from the user's own answers.
 * No AI call and no server: what you type never leaves your device.
 */
export type TemplateId = 'ncrp' | 'grievance' | 'police' | 'followup';
export type DraftLang = 'en' | 'hi';

export interface DraftFields {
  name: string;
  city: string;
  contentTypes: string[]; // real | fake | threat | filmed
  platforms: string[]; // display names
  urls: string[];
  handles: string[];
  seenAt: string; // formatted date/time
  description: string;
  // escalation / follow-up
  escalationPlatform: string;
  reportedAt: string;
  refId: string;
  recipient: string; // for follow-up: platform or police station
  earlierDate: string;
  daysElapsed: string;
  legal: { short: string; summary: string }[];
}

const FOOTER = {
  en: 'Drafted with Reclaim. This is not legal advice.',
  hi: 'Reclaim से तैयार किया गया। यह क़ानूनी सलाह नहीं है।',
};

const TYPE_TEXT: Record<string, { en: string; hi: string }> = {
  real: { en: 'a real private photo or video of me was shared without my consent', hi: 'मेरी असली निजी फ़ोटो या वीडियो मेरी सहमति के बिना साझा की गई' },
  fake: { en: 'a fake, morphed or AI-generated sexual image of me was created and shared', hi: 'मेरी नकली, मॉर्फ़्ड या एआई से बनी यौन तस्वीर बनाकर साझा की गई' },
  threat: { en: 'someone is threatening to share intimate images of me and/or demanding money', hi: 'कोई मेरी निजी तस्वीरें फैलाने की धमकी दे रहा है और/या पैसे माँग रहा है' },
  filmed: { en: 'I was secretly filmed or photographed without my consent', hi: 'मुझे मेरी सहमति के बिना छिपकर रिकॉर्ड किया गया या फ़ोटो ली गई' },
};

const blank = (v: string, lang: DraftLang) => (v.trim() ? v.trim() : lang === 'en' ? '[add]' : '[जोड़ें]');
const list = (xs: string[], lang: DraftLang) =>
  xs.filter(Boolean).length ? xs.filter(Boolean).map((x) => `- ${x}`).join('\n') : `- ${blank('', lang)}`;
const joinTypes = (types: string[], lang: DraftLang) => {
  const parts = types.map((t) => TYPE_TEXT[t]?.[lang]).filter(Boolean);
  if (!parts.length) return lang === 'en' ? 'intimate content of me was shared without my consent' : 'मेरी निजी सामग्री मेरी सहमति के बिना साझा की गई';
  return parts.join(lang === 'en' ? '; and ' : '; और ');
};
const legalLines = (f: DraftFields) => (f.legal.length ? f.legal.map((l) => `- ${l.short}: ${l.summary}`).join('\n') : '');

function ncrp(f: DraftFields, lang: DraftLang): string {
  if (lang === 'hi') {
    return `शिकायत का प्रकार: महिलाओं/बच्चों के ख़िलाफ़ साइबर अपराध (बिना सहमति निजी तस्वीरें)

मैं, ${blank(f.name, lang)}, ${blank(f.city, lang)}, यह शिकायत दर्ज कर रही/रहा हूँ कि ${joinTypes(f.contentTypes, lang)}।

मुझे यह ${blank(f.seenAt, lang)} को पता चला।

प्लेटफ़ॉर्म:
${list(f.platforms, lang)}

लिंक (URL):
${list(f.urls, lang)}

अकाउंट / हैंडल:
${list(f.handles, lang)}

क्या हुआ:
${blank(f.description, lang)}

मैंने इस सामग्री को किसी के साथ साझा करने की सहमति नहीं दी। मेरा अनुरोध है कि इसे हटाया जाए, ज़िम्मेदार व्यक्तियों की पहचान की जाए और क़ानून के अनुसार कार्रवाई की जाए।
${f.legal.length ? `\nलागू हो सकने वाले प्रावधान:\n${legalLines(f)}\n` : ''}
मेरे पास स्क्रीनशॉट और लिंक की सूची सबूत के तौर पर है, जो माँगे जाने पर दूँगी/दूँगा।

${FOOTER.hi}`;
  }
  return `Complaint category: Cyber crime against women/children (non-consensual intimate images)

I, ${blank(f.name, lang)}, of ${blank(f.city, lang)}, am filing this complaint because ${joinTypes(f.contentTypes, lang)}.

I found out on ${blank(f.seenAt, lang)}.

Platforms:
${list(f.platforms, lang)}

Links (URLs):
${list(f.urls, lang)}

Accounts / handles:
${list(f.handles, lang)}

What happened:
${blank(f.description, lang)}

I did not consent to this content being shared. I request that it be removed, that the people responsible be identified, and that action be taken under the law.
${f.legal.length ? `\nProvisions that may apply:\n${legalLines(f)}\n` : ''}
I have screenshots and a list of links as evidence and can provide them on request.

${FOOTER.en}`;
}

function grievance(f: DraftFields, lang: DraftLang): string {
  if (lang === 'hi') {
    return `विषय: नियम 3(2)(b) के तहत तत्काल हटाने का अनुरोध: बिना सहमति निजी/मॉर्फ़्ड तस्वीर (रिपोर्ट ${blank(f.refId, lang)})

प्रिय शिकायत अधिकारी, ${blank(f.escalationPlatform, lang)},

मैंने ${blank(f.reportedAt, lang)} को आपके प्लेटफ़ॉर्म पर नीचे दी गई सामग्री रिपोर्ट की थी (संदर्भ: ${blank(f.refId, lang)})। यह सामग्री ${joinTypes(f.contentTypes, lang)}।

लिंक:
${list(f.urls, lang)}

आईटी नियम 2021 के नियम 3(2)(b) (फ़रवरी 2026 संशोधन सहित) के तहत, ऐसी सामग्री की शिकायत मिलने के 2 घंटे के अंदर उसे हटाना या ब्लॉक करना ज़रूरी है। यह समय-सीमा बीत चुकी है और सामग्री अभी भी उपलब्ध है।

कृपया इसे तुरंत हटाएँ, दोबारा अपलोड रोकें, और मुझे की गई कार्रवाई की लिखित जानकारी दें।

${blank(f.name, lang)}

${FOOTER.hi}`;
  }
  return `Subject: Urgent removal under Rule 3(2)(b): non-consensual intimate / morphed image (report ${blank(f.refId, lang)})

Dear Grievance Officer, ${blank(f.escalationPlatform, lang)},

On ${blank(f.reportedAt, lang)} I reported the content below on your platform (reference: ${blank(f.refId, lang)}). In this content, ${joinTypes(f.contentTypes, lang)}.

Links:
${list(f.urls, lang)}

Under Rule 3(2)(b) of the IT Rules 2021, as amended in February 2026, such content must be removed or disabled within 2 hours of a complaint. That deadline has passed and the content is still available.

Please remove it immediately, prevent re-uploads, and confirm in writing what action you have taken.

${blank(f.name, lang)}

${FOOTER.en}`;
}

function police(f: DraftFields, lang: DraftLang): string {
  if (lang === 'hi') {
    return `सेवा में,
थाना प्रभारी,
${blank('', lang)} पुलिस स्टेशन, ${blank(f.city, lang)}

विषय: बिना सहमति निजी/मॉर्फ़्ड तस्वीरें ऑनलाइन साझा करने की शिकायत

महोदय/महोदया,

मैं, ${blank(f.name, lang)}, निवासी ${blank(f.city, lang)}, निवेदन करती/करता हूँ कि ${joinTypes(f.contentTypes, lang)}। मुझे यह ${blank(f.seenAt, lang)} को पता चला।

तथ्य:
${blank(f.description, lang)}

प्लेटफ़ॉर्म: ${f.platforms.join(', ') || blank('', lang)}

सबूत (मेरे पास सुरक्षित):
${list(f.urls, lang)}
${f.handles.filter(Boolean).length ? `\nअकाउंट / हैंडल:\n${list(f.handles, lang)}\n` : ''}${f.legal.length ? `\nलागू हो सकने वाले प्रावधान:\n${legalLines(f)}\n` : ''}
कृपया शिकायत दर्ज कर उचित कार्रवाई करें।

भवदीय/भवदीया,
${blank(f.name, lang)}

${FOOTER.hi}`;
  }
  return `To,
The Station House Officer,
${blank('', lang)} Police Station, ${blank(f.city, lang)}

Subject: Complaint about non-consensual intimate / morphed images shared online

Sir/Madam,

I, ${blank(f.name, lang)}, resident of ${blank(f.city, lang)}, wish to report that ${joinTypes(f.contentTypes, lang)}. I found out on ${blank(f.seenAt, lang)}.

Facts:
${blank(f.description, lang)}

Platforms: ${f.platforms.join(', ') || blank('', lang)}

Evidence (kept safely with me):
${list(f.urls, lang)}
${f.handles.filter(Boolean).length ? `\nAccounts / handles:\n${list(f.handles, lang)}\n` : ''}${f.legal.length ? `\nProvisions that may apply:\n${legalLines(f)}\n` : ''}
I request you to register my complaint and take appropriate action.

Yours sincerely,
${blank(f.name, lang)}

${FOOTER.en}`;
}

function followup(f: DraftFields, lang: DraftLang): string {
  if (lang === 'hi') {
    return `विषय: पिछली शिकायत पर फ़ॉलो-अप (संदर्भ: ${blank(f.refId, lang)})

प्रिय ${blank(f.recipient, lang)},

मैंने ${blank(f.earlierDate, lang)} को बिना सहमति साझा की गई निजी सामग्री के बारे में शिकायत की थी (संदर्भ: ${blank(f.refId, lang)})। तब से ${blank(f.daysElapsed, lang)} दिन बीत चुके हैं और मुझे कोई जवाब नहीं मिला है।

लिंक:
${list(f.urls, lang)}

कृपया बताएँ कि क्या कार्रवाई हुई है और सामग्री कब तक हटाई जाएगी।

${blank(f.name, lang)}

${FOOTER.hi}`;
  }
  return `Subject: Follow-up on my earlier complaint (reference: ${blank(f.refId, lang)})

Dear ${blank(f.recipient, lang)},

On ${blank(f.earlierDate, lang)} I made a complaint about intimate content shared without my consent (reference: ${blank(f.refId, lang)}). ${blank(f.daysElapsed, lang)} days have passed and I have not received a response.

Links:
${list(f.urls, lang)}

Please tell me what action has been taken and when the content will be removed.

${blank(f.name, lang)}

${FOOTER.en}`;
}

export const templates: Record<TemplateId, (f: DraftFields, lang: DraftLang) => string> = { ncrp, grievance, police, followup };
export function fillTemplate(id: TemplateId, f: DraftFields, lang: DraftLang): string {
  return templates[id](f, lang);
}
export const officialSites: Record<TemplateId, string | null> = {
  ncrp: 'https://cybercrime.gov.in/',
  grievance: null, // depends on platform
  police: null,
  followup: null,
};

/** Splits a draft into its subject line (if any) and the rest, for email routes. */
export function splitSubject(text: string): { subject: string; body: string } {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => /^\s*(Subject|विषय)\s*:/.test(l));
  if (i === -1) return { subject: '', body: text.trim() };
  const subject = lines[i].replace(/^\s*(Subject|विषय)\s*:\s*/, '').trim();
  const body = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').replace(/^\s*\n+/, '').trim();
  return { subject, body };
}
