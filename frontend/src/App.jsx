import { useState } from 'react'

const API_BASE = 'http://127.0.0.1:8001'

export default function App() {
  const [repoPath, setRepoPath] = useState('d:/Projects/CodeAtlas')
  const [summary, setSummary] = useState(null)
  const [graph, setGraph] = useState(null)
  const [mlPrompt, setMlPrompt] = useState('authentication token middleware session')
  const [mlResults, setMlResults] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok) {
      const detail = data && typeof data.detail === 'string' ? data.detail : `Request failed with status ${res.status}`
      throw new Error(detail)
    }

    return data
  }

  async function runAnalyze() {
    setStatus('analyzing')
    setError('')
    try {
      const data = await postJson(`${API_BASE}/api/analyze`, { repo_path: repoPath })
      setSummary(data)
    } catch (err) {
      setSummary(null)
      setError(err instanceof Error ? err.message : 'Unknown network error')
    } finally {
      setStatus('done')
    }
  }

  async function runGraph() {
    setStatus('graphing')
    setError('')
    try {
      const data = await postJson(`${API_BASE}/api/graph`, { repo_path: repoPath })
      setGraph(data)
    } catch (err) {
      setGraph(null)
      setError(err instanceof Error ? err.message : 'Unknown network error')
    } finally {
      setStatus('done')
    }
  }

  async function runML() {
    setStatus('ranking')
    setError('')
    try {
      const data = await postJson(`${API_BASE}/api/ml/rank`, {
        prompt: mlPrompt,
        repo_path: repoPath,
      })
      setMlResults(data.results || [])
    } catch (err) {
      setMlResults(null)
      setError(err instanceof Error ? err.message : 'Unknown network error')
    } finally {
      setStatus('done')
    }
  }

  async function runAllPipelines() {
    setStatus('running-all')
    setError('')
    try {
      const analyzeData = await postJson(`${API_BASE}/api/analyze`, { repo_path: repoPath })
      setSummary(analyzeData)

      const graphData = await postJson(`${API_BASE}/api/graph`, { repo_path: repoPath })
      setGraph(graphData)

      const mlData = await postJson(`${API_BASE}/api/ml/rank`, {
        prompt: mlPrompt,
        repo_path: repoPath,
      })
      setMlResults(mlData.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown network error')
    } finally {
      setStatus('done')
    }
  }

  return (
    <div className="page">
      <header>
        <h1>CodeAtlas 12h Prototype</h1>
        <p>Technical diagnostics console: analyzer, graph builder, and ML ranker</p>
      </header>

      <section className="panel">
        <label>Repository Path</label>
        <input value={repoPath} onChange={(e) => setRepoPath(e.target.value)} />
        <div className="row">
          <button onClick={runAnalyze}>Run Analysis</button>
          <button onClick={runGraph}>Build Graph</button>
          <button onClick={runML}>ML Rank</button>
          <button onClick={runAllPipelines}>Run All Pipelines</button>
        </div>
        <small>Status: {status}</small>
        {error ? <p style={{ color: '#b91c1c', marginTop: 8 }}>Error: {error}</p> : null}
      </section>

      <section className="kpiRow">
        <div className="kpiCard">
          <span>Total Files</span>
          <strong>{summary?.total_files ?? '-'}</strong>
        </div>
        <div className="kpiCard">
          <span>Total Lines</span>
          <strong>{summary?.total_lines ?? '-'}</strong>
        </div>
        <div className="kpiCard">
          <span>Project Type</span>
          <strong>{summary?.project_type ?? '-'}</strong>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Analyzer Output</h2>
          {summary ? (
            <>
              <p><strong>Focus modules:</strong> {(summary.focus_modules || []).map(([name, count]) => `${name} (${count})`).join(', ') || 'n/a'}</p>
              <p><strong>Top file hotspots:</strong> {(summary.hottest_files || []).slice(0, 3).map(([path, lines]) => `${path} (${lines})`).join(', ') || 'n/a'}</p>
              <pre>{JSON.stringify({ observations: summary.observations, technical_metrics: summary.technical_metrics, top_extensions: summary.top_extensions }, null, 2)}</pre>
            </>
          ) : (
            <pre>No data yet</pre>
          )}
        </article>

        <article className="card">
          <h2>Graph Output</h2>
          <pre>{graph ? JSON.stringify({ node_count: graph.node_count, edge_count: graph.edge_count, focus_clusters: graph.focus_clusters, note: graph.note }, null, 2) : 'No data yet'}</pre>
        </article>

        <article className="card">
          <h2>ML Ranking Output</h2>
          <input value={mlPrompt} onChange={(e) => setMlPrompt(e.target.value)} />
          <pre>{mlResults !== null ? JSON.stringify(mlResults, null, 2) : 'No data yet'}</pre>
        </article>
      </section>
    </div>
  )
}
