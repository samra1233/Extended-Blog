const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';

const fallbackSummarize = (text) => {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.trim().length > 15);
  if (sentences.length <= 3) return text.trim();
  return sentences.slice(0, 3).join(' ');
};

export const summarizePost = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400);
      throw new Error('content is required');
    }

    const token = process.env.HF_API_TOKEN;

    const words = content.trim().split(/\s+/);
    const truncated = words.length > 700 ? words.slice(0, 700).join(' ') : content;

    try {
      const hfRes = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: truncated,
          parameters: { max_length: 130, min_length: 30, do_sample: false },
        }),
      });

      const data = await hfRes.json();

      if (hfRes.ok && data?.[0]?.summary_text) {
        return res.json({ summary: data[0].summary_text });
      }
    } catch {
      // Fallback to extractive summary if HuggingFace API is unreachable
    }

    // Return smart extractive summary if HuggingFace is warming up or unavailable
    return res.json({ summary: fallbackSummarize(content) });
  } catch (err) {
    next(err);
  }
};
