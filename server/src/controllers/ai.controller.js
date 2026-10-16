/**
 * AI Controller for NoteFlow
 * Uses @google/genai with gemini-2.5-flash on the server side.
 * Falls back to smart rule-based NLP heuristics if API key is not configured.
 */

import { GoogleGenAI } from '@google/genai';

function localFallbackProcess(task, title, content) {
  const fullText = `${title}\n${content}`.trim();
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  switch (task) {
    case 'summarize': {
      const firstLines = lines.slice(0, 3).join(' ');
      const wordCount = fullText.split(/\s+/).length;
      return {
        result: `**Summary of "${title || 'Note'}"**\n\n${firstLines || fullText.slice(0, 200)}...\n\n**Key Takeaways:**\n- Main topic: ${title || 'Core ideas'}\n- Approximate length: ${wordCount} words\n- Key points extracted from content.`,
        source: 'local-fallback'
      };
    }
    case 'checklist': {
      const actionItems = lines
        .filter(l => !l.startsWith('#'))
        .slice(0, 5)
        .map(l => {
          const clean = l.replace(/^[-*•\d.)\]\s]+/, '').trim();
          return `[ ] ${clean}`;
        });
      const fallbackList = actionItems.length > 0
        ? actionItems.join('\n')
        : `[ ] Review ${title || 'note'}\n[ ] Follow up on key action items\n[ ] Update project documentation`;
      return {
        result: fallbackList,
        source: 'local-fallback'
      };
    }
    case 'tags': {
      const words = fullText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'your', 'about', 'note'].includes(w));
      const freq = {};
      for (const w of words) freq[w] = (freq[w] || 0) + 1;
      const topWords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([w]) => w);
      return {
        result: topWords.length > 0 ? topWords : ['productivity', 'notes', 'ideas'],
        source: 'local-fallback'
      };
    }
    case 'simplify': {
      const cleaned = content
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ');
      return {
        result: `Key message: ${cleaned.slice(0, 300)}`,
        source: 'local-fallback'
      };
    }
    case 'expand': {
      return {
        result: `${content}\n\n### Next Steps & Action Items:\n- Deep dive into research and requirements for "${title}"\n- Validate edge cases and cross-platform compatibility\n- Document learnings and share updates with the team`,
        source: 'local-fallback'
      };
    }
    default:
      return { result: content, source: 'local-fallback' };
  }
}

export async function processNoteWithAI(req, res) {
  const { task = 'summarize', title = '', content = '' } = req.body;

  if (!content && !title) {
    return res.status(400).json({ success: false, error: 'Note title or content is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallback = localFallbackProcess(task, title, content);
    return res.status(200).json({
      success: true,
      data: fallback.result,
      source: fallback.source,
      notice: 'Operating with local assistant heuristics. Set GEMINI_API_KEY for live Gemini 2.5 Flash superpowers.'
    });
  }

  try {
    const ai = new GoogleGenAI();

    let prompt = '';
    switch (task) {
      case 'summarize':
        prompt = `You are NoteFlow AI Assistant. Summarize this note clearly and concisely with an executive summary paragraph followed by 3 high-impact bullet points:\n\nTitle: ${title}\nContent:\n${content}`;
        break;
      case 'checklist':
        prompt = `You are NoteFlow AI Assistant. Extract or transform the following note into a markdown task checklist using "[ ] " for uncompleted tasks. Output ONLY the markdown checklist:\n\nTitle: ${title}\nContent:\n${content}`;
        break;
      case 'tags':
        prompt = `You are NoteFlow AI Assistant. Suggest 3 to 5 single-word relevant lowercase tags for this note. Return ONLY a valid JSON array of strings like ["tag1", "tag2", "tag3"] without code fences:\n\nTitle: ${title}\nContent:\n${content}`;
        break;
      case 'simplify':
        prompt = `You are NoteFlow AI Assistant. Rewrite this note to make it ultra-clear, simple, and easy to read, preserving all essential details:\n\nTitle: ${title}\nContent:\n${content}`;
        break;
      case 'expand':
        prompt = `You are NoteFlow AI Assistant. Expand this note with constructive context, key considerations, and actionable next steps while preserving original thoughts:\n\nTitle: ${title}\nContent:\n${content}`;
        break;
      default:
        prompt = `Polish and improve this note:\n\nTitle: ${title}\nContent:\n${content}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let outputText = response.text || '';

    if (task === 'tags') {
      try {
        const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedTags = JSON.parse(cleanJson);
        if (Array.isArray(parsedTags)) {
          return res.status(200).json({
            success: true,
            data: parsedTags.map(t => String(t).toLowerCase().replace(/[^a-z0-9_-]/g, '')),
            source: 'gemini-2.5-flash'
          });
        }
      } catch {
        // Fall through to plain text if JSON parse failed
      }
    }

    return res.status(200).json({
      success: true,
      data: outputText.trim(),
      source: 'gemini-2.5-flash'
    });
  } catch (error) {
    console.warn('[AI Processing Error, falling back to local NLP]', error.message);
    const fallback = localFallbackProcess(task, title, content);
    return res.status(200).json({
      success: true,
      data: fallback.result,
      source: fallback.source,
      warning: 'Gemini request encountered an error, used intelligent local heuristic fallback.'
    });
  }
}

export default { processNoteWithAI };
