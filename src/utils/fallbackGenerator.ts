export function generateSmartFallback(task: string, context?: string, axis?: string) {
  const shortTask = task.trim() || 'Core task';
  const selectedAxis = axis || 'readiness';

  if (selectedAxis === 'profile') {
    return {
      lanes: [
        {
          tier: 'Support',
          task_text: `[Visual & Diagrammatic Route] ${shortTask}: Create a visual concept map, flowchart, or annotated diagram representing key components and connections.`,
          scaffold: 'Concept map graphic organizer with key visual labels and arrow connectors.',
          vocab: ['Visual Representation', 'Structure', 'Connection', 'Diagram']
        },
        {
          tier: 'Core',
          task_text: `[Analytical Text Route] ${shortTask}: Write a structured analytical summary evaluating core arguments and supporting evidence.`,
          scaffold: 'Guided paragraph outline with sentence starters for cause and effect.',
          vocab: ['Analysis', 'Evidence', 'Context', 'Perspective']
        },
        {
          tier: 'Extend',
          task_text: `[Investigative Practical Route] ${shortTask}: Formulate a practical case study or real-world application scenario testing these principles.`,
          scaffold: 'Case study investigation rubric and self-directed inquiry checklist.',
          vocab: ['Application', 'Case Study', 'Evaluation', 'Implication']
        }
      ],
      talk_moves: [
        { tier: 'Support', prompts: ['How do the visual arrows show relationships?', 'What does each color or symbol represent?'] },
        { tier: 'Core', prompts: ['What evidence best supports your thesis statement?', 'How do your paragraphs connect?'] },
        { tier: 'Extend', prompts: ['How would this principle function in an unexpected scenario?', 'What variables need testing?'] }
      ],
      grouping_tip: 'Group students by learning profile preference into visual, textual, and investigative collaborative stations.'
    };
  }

  if (selectedAxis === 'product') {
    return {
      lanes: [
        {
          tier: 'Support',
          task_text: `[Structured Written Format] ${shortTask}: Produce a structured bulleted briefing note or guided response table answering core objectives.`,
          scaffold: 'Sentence starters: "The primary point is... This demonstrates..." with key word bank.',
          vocab: ['Briefing', 'Key Point', 'Evidence', 'Starter']
        },
        {
          tier: 'Core',
          task_text: `[Infographic / Model Summary] ${shortTask}: Design an explanatory digital infographic or poster summarizing core findings and key evidence.`,
          scaffold: 'Infographic layout grid with section prompts for data, quotes, and conclusions.',
          vocab: ['Summary', 'Visual Model', 'Synthesis', 'Layout']
        },
        {
          tier: 'Extend',
          task_text: `[Debate Pitch / Podcast Script] ${shortTask}: Script and deliver a 2-minute persuasive audio pitch or podcast debate arguing your perspective.`,
          scaffold: 'Persuasive rhetoric rubric (Ethos, Pathos, Logos) and audio script template.',
          vocab: ['Rhetoric', 'Counterargument', 'Pitch', 'Justification']
        }
      ],
      talk_moves: [
        { tier: 'Support', prompts: ['Which sentence frame helped you start?', 'What key word completes your bullet point?'] },
        { tier: 'Core', prompts: ['How does your infographic guide the viewer\'s eyes?', 'What is the key takeaway?'] },
        { tier: 'Extend', prompts: ['What persuasive technique makes your argument strongest?', 'How do you address objections?'] }
      ],
      grouping_tip: 'Arrange stations by product format so students can peer-review shared media types.'
    };
  }

  // Default: Readiness Axis
  return {
    lanes: [
      {
        tier: 'Support',
        task_text: `[Support Lane] ${shortTask}: Complete the guided breakdown in 3 steps. Step 1: Identify 2 key ideas or examples. Step 2: Use the provided sentence starters to explain each. Step 3: Check your key vocabulary list.`,
        scaffold: 'Sentence starter: "The main idea of this prompt is ___ because ___." Includes word bank and guided checklist.',
        vocab: ['Identify', 'Main Idea', 'Evidence', 'Context']
      },
      {
        tier: 'Core',
        task_text: `[Core Lane] ${shortTask}: Analyze the core prompt. Explain your reasoning thoroughly, incorporating subject vocabulary and supporting evidence.`,
        scaffold: 'Guided outline with prompt questions for analytical paragraph structure.',
        vocab: ['Analysis', 'Explanation', 'Perspective', 'Conclusion']
      },
      {
        tier: 'Extend',
        task_text: `[Extend Lane] ${shortTask}: Critically evaluate contrasting perspectives or secondary implications. Formulate an original argument and justify your position against counterclaims.`,
        scaffold: 'Open-ended critical evaluation framework & self-assessment rubric.',
        vocab: ['Evaluation', 'Thesis', 'Counterclaim', 'Justification']
      }
    ],
    talk_moves: [
      { tier: 'Support', prompts: ['Which vocabulary word fits your first sentence starter?', 'What is one example you identified?'] },
      { tier: 'Core', prompts: ['What evidence connects your point to the topic?', 'Can you explain your reasoning in your own words?'] },
      { tier: 'Extend', prompts: ['What counterargument might an expert raise?', 'How does this principle apply in a broader context?'] }
    ],
    grouping_tip: 'Seat Support students in flexible pairs near the primary display, with Core and Extend students in collaborative inquiry triads.'
  };
}
