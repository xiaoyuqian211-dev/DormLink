import { MessageSquareText, Send, SlidersHorizontal } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import type { EnvironmentState } from "../types";

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

export default function Assistant() {
  const [question, setQuestion] = useState("为什么现在宿舍有点闷？");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [feedbackType, setFeedbackType] = useState("comfort");
  const [userResponse, setUserResponse] = useState("too_hot");
  const [sceneLabel, setSceneLabel] = useState("study");
  const [comment, setComment] = useState("现在确实有点闷热");
  const [state, setState] = useState<EnvironmentState | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getEnvironmentState()
      .then(setState)
      .catch(() => {
        setState(null);
      });
  }, []);

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    setAsking(true);
    setError("");
    try {
      const response = await api.askQuestion(question);
      setAnswer(response.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "问答请求失败");
    } finally {
      setAsking(false);
    }
  }

  async function handleFeedback(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      const response = await api.submitFeedback({
        room_id: state?.room_id ?? "Dorm-A101",
        feedback_type: feedbackType,
        system_judgement: state?.comfort_level ?? "slightly_uncomfortable",
        user_response: userResponse,
        scene_label: sceneLabel,
        comment,
      });
      setNotice(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "反馈提交失败");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase text-cyan-700">
          Assistant
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          智能解释与人在回路反馈
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          当前回答由规则服务生成，后续可替换为 RAG + 大模型解释模块；反馈会保存为人在回路优化数据。
        </p>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <form
          onSubmit={handleAsk}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel"
        >
          <div className="mb-5 flex items-center gap-2">
            <MessageSquareText size={20} className="text-cyan-700" />
            <h3 className="text-lg font-semibold text-slate-950">智能问答</h3>
          </div>
          <label className="text-sm font-medium text-slate-600" htmlFor="question">
            提问内容
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="question"
              className={inputClass}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="例如：为什么现在宿舍有点闷？"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send size={17} />
              {asking ? "分析中" : "提问"}
            </button>
          </div>
          <div className="mt-5 min-h-36 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">回答</p>
            <p className="mt-2 text-base leading-7 text-slate-800">
              {answer || "提交问题后，这里会显示 DormLink 的规则解释结果。"}
            </p>
          </div>
        </form>

        <form
          onSubmit={handleFeedback}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel"
        >
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-emerald-700" />
            <h3 className="text-lg font-semibold text-slate-950">用户反馈</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              反馈类型
              <select
                className={`${selectClass} mt-2`}
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value)}
              >
                <option value="comfort">舒适度反馈</option>
                <option value="alert_accuracy">提醒准确性反馈</option>
                <option value="suggestion_effectiveness">建议有效性反馈</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              用户感受
              <select
                className={`${selectClass} mt-2`}
                value={userResponse}
                onChange={(event) => setUserResponse(event.target.value)}
              >
                <option value="comfortable">舒适</option>
                <option value="too_hot">偏热</option>
                <option value="too_cold">偏冷</option>
                <option value="stuffy">太闷</option>
                <option value="bad_air">空气差</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              场景
              <select
                className={`${selectClass} mt-2`}
                value={sceneLabel}
                onChange={(event) => setSceneLabel(event.target.value)}
              >
                <option value="study">学习</option>
                <option value="rest">休息</option>
                <option value="sleep">睡觉</option>
                <option value="empty">无人</option>
                <option value="party">聚会</option>
              </select>
            </label>
            <div className="text-sm font-medium text-slate-600">
              系统判断
              <div className="mt-2">
                <StatusBadge tone="info">
                  {state?.comfort_level ?? "slightly_uncomfortable"}
                </StatusBadge>
              </div>
            </div>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-600">
            备注
            <textarea
              className={`${inputClass} mt-2 min-h-28 resize-none`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="补充当前体感或场景说明"
            />
          </label>
          <button
            type="submit"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Send size={17} />
            提交反馈
          </button>
          {notice ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
