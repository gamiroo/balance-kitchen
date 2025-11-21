// app/data/faqData.ts

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  {
    id: "1",
    question: "How do I place an order?",
    answer: "Each week, we'll send you a link to our order form where you can select meals for the following week. This form usually goes out on Sunday or Monday, and you'll have until Friday at 10am to submit your order. This allows our admin team time to organise everything the kitchen needs to prepare for the week ahead."
  },
  {
    id: "2",
    question: "Do I have to order every week?",
    answer: "Nope! You're in control. Pause or skip anytime. Once you've topped up your account, you can order as much or as little as you need each week. If you're a regular, your account manager may send you a gentle reminder to check in. We know how busy life can get!"
  },
  {
    id: "3",
    question: "How does delivery work and can I have the option to pick up?",
    answer: "We deliver meals Sunday through to Thursday. As everything is packed fresh daily, deliveries begin from 4:30pm onwards. You'll be notified by your account manager or delivery driver with your delivery window. Pick up is an available option at our Richlands location!"
  },
  {
    id: "4",
    question: "What areas do you deliver to?",
    answer: "We currently deliver to Brisbane City & Surrounds, Ipswich City & Surrounds, Gold Coast City & Surrounds."
  },
  {
    id: "5",
    question: "Do you cater to dietary requirements?",
    answer: "We do! For customised meal plans based on specific dietary needs or macros, just reach out to your account manager so we can gather all the necessary information and provide you with a tailored quote."
  },
  {
    id: "6",
    question: "How do I let you know about my allergies or dislikes?",
    answer: "You can notify us when filling in your client intake form, in your weekly order form, or by updating details with your account manager anytime."
  },
{
    id: "7",
    question: "How do I get started?",
    answer: "All you need to do to get started is enquire now and our team will be in touch within the next 24 hours. Our team will get in touch with further information and lock in your meal plan journey with Balance Kitchen!"
  }
];
