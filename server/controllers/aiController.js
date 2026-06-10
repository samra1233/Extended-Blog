const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';

export const summarizePost = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400);
      throw new Error('content is required');
    }

    if (!process.env.HF_API_TOKEN) {
      res.status(503);
      throw new Error('AI summarization is not configured on this server');
    }

    // BART large CNN has a ~1024-token window (~700 words)
    const words = content.trim().split(/\s+/);
    const truncated = words.length > 700 ? words.slice(0, 700).join(' ') : content;

    const hfRes = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: truncated,
        parameters: { max_length: 130, min_length: 30, do_sample: false },
      }),
    });

    const data = await hfRes.json();

    if (!hfRes.ok) {
      // HF returns 503 while the model is cold-starting
      if (hfRes.status === 503 || data?.error?.toLowerCase().includes('loading')) {
        res.status(503);
        throw new Error('AI model is warming up — please try again in about 20 seconds');
      }
      res.status(502);
      throw new Error(data?.error || 'HuggingFace API error');
    }

    const summary = data?.[0]?.summary_text;
    if (!summary) {
      res.status(502);
      throw new Error('Unexpected response from AI model');
    }

    res.json({ summary });
  } catch (err) {
    next(err);
  }
};
