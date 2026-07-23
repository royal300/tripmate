import { mockPackages } from './mockPackages';

export const getMockResponse = (userInput: string, messageCount: number) => {
  const lowerInput = userInput.toLowerCase();
  
  if (lowerInput.includes('kerala')) {
    return {
      text: "Kerala is a beautiful choice! Here are some of our best-selling packages for the backwaters and hills:",
      packages: mockPackages.filter(p => p.destination.toLowerCase().includes('kerala'))
    };
  }

  if (lowerInput.includes('goa')) {
    return {
      text: "Goa is perfect for a quick getaway! Check out these options:",
      packages: mockPackages.filter(p => p.destination.toLowerCase().includes('goa'))
    };
  }

  if (lowerInput.includes('honeymoon')) {
    return {
      text: "Congratulations! We have some amazing romantic destinations. Our Andaman package is highly recommended for honeymoons.",
      packages: mockPackages.filter(p => p.destination.toLowerCase().includes('andaman'))
    };
  }

  if (lowerInput.includes('under') || lowerInput.includes('budget') || lowerInput.includes('cheap')) {
    return {
      text: "I found a few great budget-friendly options under ₹20,000 for you:",
      packages: mockPackages.filter(p => p.price <= 20000)
    };
  }

  // After returning packages, or on the 3rd user message, trigger the lead form
  if (messageCount >= 2) {
    return {
      text: "Got it! To help me send you the detailed itinerary and check live availability, could you quickly share your name and number?",
      showLeadForm: true
    };
  }

  if (messageCount === 1) {
    return {
      text: "I can help you with that! Are you looking for a family trip, honeymoon, or a solo adventure? Also, any specific dates in mind?"
    };
  }

  return {
    text: "That sounds exciting! We have many packages that might fit. Could you tell me a bit more about your preferred destination or budget?"
  };
};
