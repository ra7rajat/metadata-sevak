/**
 * Static FAQ fallback when Gemini API is unavailable
 * Provides basic election information to users even when AI fails
 * @module lib/staticFaq
 */

export const STATIC_FAQ = {
  en: {
    greeting: "Hello! I'm currently experiencing some technical difficulties. Here are some quick answers:",
    faqs: [
      {
        q: "How do I register to vote?",
        a: "Visit nvsp.in or your nearest Election Commission office. You'll need: 1) Photo ID, 2) Age proof, 3) Address proof. The process is free."
      },
      {
        q: "How do I find my polling booth?",
        a: "Go to eci.gov.in and enter your EPIC number or search by your address. You can also check via the Voter Helpline app."
      },
      {
        q: "What is ECI?",
        a: "ECI stands for Election Commission of India - the constitutional body that conducts elections in India."
      },
      {
        q: "What is NVSP?",
        a: "NVSP is the National Voter Service Portal - eci.nic.in/nvsp - where you can register, check status, and download your voter ID."
      }
    ],
    fallback: "For more help, please try again later or visit eci.gov.in"
  },
  hi: {
    greeting: "नमस्ते! मुझे तकनीकी समस्या हो रही है। यहाँ कुछ त्वरित उत्तर हैं:",
    faqs: [
      {
        q: "मतदाता के रूप में पंजीकरण कैसे करें?",
        a: "nvsp.in पर जाएं या निकटतम चुनाव आयोग कार्यालय जाएं। आपको चाहिए: 1) फोटो पहचान पत्र, 2) आयु प्रमाण, 3) पते का प्रमाण। प्रक्रिया निःशुल्क है।"
      },
      {
        q: "मेरा मतदान केंद्र कैसे पता करें?",
        a: "eci.gov.in पर जाएं और अपना EPIC नंबर दर्ज करें। आप Voter Helpline ऐप से भी जांच सकते हैं।"
      },
      {
        q: "ECI क्या है?",
        a: "ECI का अर्थ है भारत का चुनाव आयोग - संवैधानिक निकाय जो भारत में चुनाव संचालित करता है।"
      },
      {
        q: "NVSP क्या है?",
        a: "NVSP राष्ट्रीय मतदाता सेवा पोर्टल है - eci.nic.in/nvsp - जहाँ आप पंजीकरण करा सकते हैं, स्थिति जांच सकते हैं और वोटर ID डाउनलोड कर सकते हैं।"
      }
    ],
    fallback: "अधिक जानकारी के लिए बाद में पुनः प्रयास करें या eci.gov.in पर जाएं"
  }
};

/**
 * Get static FAQ response for a given language
 */
export function getStaticFaq(lang: 'en' | 'hi' = 'en'): string {
  const faq = STATIC_FAQ[lang];
  let response = `${faq.greeting}\n\n`;
  
  for (const item of faq.faqs) {
    response += `Q: ${item.q}\nA: ${item.a}\n\n`;
  }
  
  response += faq.fallback;
  return response;
}