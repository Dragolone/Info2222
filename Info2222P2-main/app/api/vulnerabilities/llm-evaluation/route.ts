import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define a schema for security queries
const querySchema = z.object({
  query: z.string().min(5).max(1000),
  llmType: z.string().min(1).max(100),
  response: z.string().min(1),
});

// Database to store LLM security evaluation results
interface LlmEvaluation {
  id: string;
  query: string;
  llmType: string;
  response: string;
  evaluationResults: {
    accuracyScore: number;
    completenessScore: number;
    bestPracticesScore: number;
    vulnerabilityAwarenessScore: number;
    consistencyScore: number;
    overallScore: number;
    feedback: string;
  };
  createdAt: Date;
}

/**
 * Storage for LLM evaluation results
 * In a real implementation, this would be a database
 */
const llmEvaluations: LlmEvaluation[] = [];

/**
 * Endpoint to store and analyze LLM responses to security queries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = querySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { query, llmType, response } = validationResult.data;

    // Generate a simple ID
    const id = `eval_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Evaluate the LLM response (in a real implementation, this would be more sophisticated)
    const evaluationResults = evaluateLlmSecurityResponse(query, response);

    // Store the evaluation
    const evaluation: LlmEvaluation = {
      id,
      query,
      llmType,
      response,
      evaluationResults,
      createdAt: new Date(),
    };

    llmEvaluations.push(evaluation);

    return NextResponse.json({
      message: "LLM security response evaluation stored",
      evaluationId: id,
      results: evaluationResults,
    });
  } catch (error) {
    console.error("Error processing LLM evaluation:", error);
    return NextResponse.json(
      { error: "Failed to process LLM evaluation" },
      { status: 500 }
    );
  }
}

/**
 * Get all stored LLM evaluations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const llmType = searchParams.get("llmType");

    let results = [...llmEvaluations];

    // Filter by LLM type if provided
    if (llmType) {
      results = results.filter(eval => eval.llmType === llmType);
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Map to remove full responses for brevity
    const summaries = results.map(eval => ({
      id: eval.id,
      query: eval.query,
      llmType: eval.llmType,
      responseLength: eval.response.length,
      overallScore: eval.evaluationResults.overallScore,
      createdAt: eval.createdAt,
    }));

    return NextResponse.json({
      evaluations: summaries,
      count: summaries.length,
    });
  } catch (error) {
    console.error("Error fetching LLM evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM evaluations" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to evaluate LLM responses to security queries
 * This is a simplified implementation - in a real system, this would be much more sophisticated
 * and would likely use AI or expert systems to evaluate responses
 */
function evaluateLlmSecurityResponse(query: string, response: string) {
  // Default scores
  let accuracyScore = 0;
  let completenessScore = 0;
  let bestPracticesScore = 0;
  let vulnerabilityAwarenessScore = 0;
  let consistencyScore = 0;
  let feedback = "Response requires human evaluation.";

  // Keywords to look for in responses depending on query type
  const securityKeywords = {
    password: ["hash", "salt", "bcrypt", "argon2", "never store plaintext", "one-way", "secure"],
    sql: ["prepared statements", "parameterized", "injection", "ORM", "sanitize", "escape"],
    xss: ["sanitize", "escape", "content security policy", "CSP", "DOMPurify", "encode", "whitelist"],
    authentication: ["JWT", "session", "OAuth", "two-factor", "2FA", "MFA", "rate limiting"],
    authorization: ["RBAC", "ACL", "principle of least privilege", "permissions", "access control"],
    encryption: ["AES", "RSA", "asymmetric", "symmetric", "key management", "TLS", "SSL"],
  };

  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();

  // Check which security topic the query relates to
  const relevantTopics = Object.entries(securityKeywords)
    .filter(([topic]) => queryLower.includes(topic))
    .map(([topic, keywords]) => ({ topic, keywords }));

  if (relevantTopics.length > 0) {
    // Check for presence of relevant keywords
    relevantTopics.forEach(({ topic, keywords }) => {
      const foundKeywords = keywords.filter(keyword =>
        responseLower.includes(keyword.toLowerCase())
      );

      // Assign scores based on keyword presence (simplified)
      const keywordCoverage = foundKeywords.length / keywords.length;

      // Update scores
      accuracyScore += keywordCoverage * 2; // Max 2 points per topic
      completenessScore += keywordCoverage * 2;
      bestPracticesScore += keywordCoverage * 2;

      // Check for vulnerability awareness
      if (responseLower.includes("vulnerability") ||
          responseLower.includes("attack") ||
          responseLower.includes("exploit")) {
        vulnerabilityAwarenessScore += 1;
      }

      if (responseLower.includes("best practice") ||
          responseLower.includes("recommend")) {
        bestPracticesScore += 1;
      }
    });

    // Normalize scores to 0-10 range
    const topicCount = relevantTopics.length;
    accuracyScore = Math.min(10, (accuracyScore / topicCount) * 5);
    completenessScore = Math.min(10, (completenessScore / topicCount) * 5);
    bestPracticesScore = Math.min(10, (bestPracticesScore / topicCount) * 5);
    vulnerabilityAwarenessScore = Math.min(10, (vulnerabilityAwarenessScore / topicCount) * 10);

    // Consistency is hard to evaluate automatically - set a default
    consistencyScore = 5;

    // Generate feedback
    if (accuracyScore > 7 && completenessScore > 7) {
      feedback = "Response appears to cover security best practices well.";
    } else if (accuracyScore > 5) {
      feedback = "Response contains some security information but may be incomplete.";
    } else {
      feedback = "Response may not adequately address security concerns.";
    }
  }

  // Calculate overall score (weighted average)
  const overallScore = (
    (accuracyScore * 0.3) +
    (completenessScore * 0.2) +
    (bestPracticesScore * 0.2) +
    (vulnerabilityAwarenessScore * 0.2) +
    (consistencyScore * 0.1)
  );

  return {
    accuracyScore: parseFloat(accuracyScore.toFixed(1)),
    completenessScore: parseFloat(completenessScore.toFixed(1)),
    bestPracticesScore: parseFloat(bestPracticesScore.toFixed(1)),
    vulnerabilityAwarenessScore: parseFloat(vulnerabilityAwarenessScore.toFixed(1)),
    consistencyScore: parseFloat(consistencyScore.toFixed(1)),
    overallScore: parseFloat(overallScore.toFixed(1)),
    feedback,
  };
}
