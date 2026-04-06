import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import EventModal from "../components/EventModal";
import DayPanel from "../components/DayPanel";
import SheetView from "../components/SheetView";
import SetupView from "../components/SetupView";
import { TEAMS, getTeamColor, getTeamName, EVENT_TITLE, MONTHS, DAYS_OF_WEEK } from "../lib/constants";

const POLL_INTERVAL = 30000; // auto-refresh every 30 seconds

async function apiGet() {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Failed to load events");
  const data = await res.json();
  return data.events || [];
}

async function apiPost(body) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

export default function Home() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab]             = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal]         = useState(null);
  const [theme, setTheme]         = useState("light");
  const [lastRefresh, setLastRefresh] = useState(null);
  const pollRef = useRef(null);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const evs = await apiGet();
      setEvents(evs);
      setLastRefresh(new Date());
    } catch (e) {
      if (!silent) setLoadError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadEvents(false); }, [loadEvents]);

  // Auto-refresh polling
  useEffect(() => {
    pollRef.current = setInterval(() => loadEvents(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadEvents]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") loadEvents(true);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadEvents]);

  async function handleSave(payload) {
    const eventData = {
      id:      payload.id || undefined,
      team:    payload.team,
      date:    payload.date,
      details: payload.details || "",
      title:   EVENT_TITLE,
    };
    const data = await apiPost({ action: "saveEvent", event: eventData });
    const gasId = data.event?.id || data.id;

    if (payload.id) {
      setEvents((prev) =>
        prev.map((e) => e.id === payload.id ? { ...e, ...eventData, id: payload.id } : e)
      );
    } else {
      setEvents((prev) => [...prev, { ...eventData, id: gasId || Date.now().toString() }]);
    }
  }

  async function handleDelete(id) {
    await apiPost({ action: "deleteEvent", id });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function eventsForDate(dateStr) {
    return events.filter((e) => e.date === dateStr);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const totalDays = daysInMonth(year, month);
  const startDay  = firstDayOfMonth(year, month);
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const dk = theme === "dark";

  const refreshLabel = lastRefresh
    ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  return (
    <>
      <Head>
        <title>Ragay PK Team Calendar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-icon">🏥</span>
            <div>
              <div className="brand-title">Ragay PK Team</div>
              <div className="brand-sub">PuroKalusugan Calendar</div>
            </div>
          </div>

          <nav className="nav">
            {[
              { id: "calendar", label: "📅 Calendar" },
              { id: "list",     label: "📋 List View" },
              { id: "setup",    label: "⚙️ Setup" },
            ].map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Theme toggle */}
          <div className="theme-row">
            <span className="theme-label">{dk ? "🌙 Dark" : "☀️ Light"}</span>
            <button
              className={`toggle ${dk ? "toggle-dark" : "toggle-light"}`}
              onClick={() => setTheme(dk ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <span className="toggle-knob" />
            </button>
          </div>

          {/* Barangay legend */}
          <div className="legend">
            <div className="legend-title">Barangay</div>
            {TEAMS.map((t) => (
              <div key={t.id} className="legend-item">
                <span className="legend-dot" style={{ background: getTeamColor(t.id) }} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="main-area">
          {tab === "calendar" && (
            <div className="cal-layout">
              <div className="cal-pane">
                <div className="cal-header">
                  <button className="nav-arrow" onClick={prevMonth}>‹</button>
                  <h1 className="cal-title">{MONTHS[month]} {year}</h1>
                  <button className="nav-arrow" onClick={nextMonth}>›</button>
                  <button className="btn-today" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>
                    Today
                  </button>
                  <button className="btn-refresh" onClick={() => loadEvents(false)} title={refreshLabel}>
                    ↻ {refreshLabel}
                  </button>
                  <button className="btn-add-top" onClick={() => setModal({ event: null, defaultDate: todayStr })}>
                    + Add
                  </button>
                </div>

                {loading && <div className="info-bar">Loading schedules…</div>}
                {loadError && (
                  <div className="info-bar error">
                    {loadError} — <button onClick={() => loadEvents(false)}>Retry</button>
                  </div>
                )}

                <div className="dow-row">
                  {DAYS_OF_WEEK.map((d) => <div key={d} className="dow-cell">{d}</div>)}
                </div>

                <div className="grid">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} className="grid-cell empty" />;
                    const dateStr   = toDateStr(year, month, day);
                    const dayEvents = eventsForDate(dateStr);
                    const isToday   = dateStr === todayStr;
                    const isSel     = dateStr === selectedDate;

                    return (
                      <div
                        key={dateStr}
                        className={`grid-cell${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
                        onClick={() => setSelectedDate(isSel ? null : dateStr)}
                      >
                        <div className="day-num">{day}</div>
                        <div className="day-events">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className="day-pill"
                              style={{
                                background:  getTeamColor(ev.team) + "28",
                                color:       getTeamColor(ev.team),
                                borderColor: getTeamColor(ev.team),
                              }}
                              onClick={(e) => { e.stopPropagation(); setModal({ event: ev, defaultDate: dateStr }); }}
                              title={getTeamName(ev.team)}
                            >
                              {getTeamName(ev.team)}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="more-pill">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="side-panel">
                  <DayPanel
                    date={selectedDate}
                    events={eventsForDate(selectedDate)}
                    onEdit={(ev) => setModal({ event: ev, defaultDate: selectedDate })}
                    onAdd={(d) => setModal({ event: null, defaultDate: d })}
                    onClose={() => setSelectedDate(null)}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          )}

          {tab === "list" && (
            <SheetView
              events={events}
              onEdit={(ev) => setModal({ event: ev, defaultDate: ev.date })}
              onAdd={(d) => setModal({ event: null, defaultDate: d || todayStr })}
              theme={theme}
              onRefresh={() => loadEvents(false)}
              refreshLabel={refreshLabel}
            />
          )}

          {tab === "setup" && <SetupView theme={theme} />}
        </main>
      </div>

      {modal !== null && (
        <EventModal
          event={modal.event}
          defaultDate={modal.defaultDate}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
          theme={theme}
        />
      )}

      <style jsx>{`
        .app-shell { display: flex; height: 100vh; overflow: hidden; }

        /* ── Sidebar ── */
        .sidebar {
          width: 230px; flex-shrink: 0;
          background: ${dk ? "#131929" : "#ffffff"};
          border-right: 1px solid ${dk ? "#2d3354" : "#e2e8f0"};
          display: flex; flex-direction: column; overflow-y: auto;
          transition: background 0.2s, border-color 0.2s;
        }
        .brand {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 16px 16px;
          border-bottom: 1px solid ${dk ? "#2d3354" : "#e2e8f0"};
        }
        .brand-icon { font-size: 1.6rem; }
        .brand-title { font-weight: 700; font-size: 0.9rem; color: ${dk ? "#e2e8f0" : "#1a202c"}; }
        .brand-sub { font-size: 0.68rem; color: ${dk ? "#8892b0" : "#718096"}; margin-top: 2px; }

        .nav { padding: 12px 10px; border-bottom: 1px solid ${dk ? "#2d3354" : "#e2e8f0"}; }
        .nav-btn {
          display: block; width: 100%; text-align: left; padding: 9px 12px;
          background: none; border: none; border-radius: 7px;
          color: ${dk ? "#8892b0" : "#4a5568"};
          cursor: pointer; font-size: 0.88rem; margin-bottom: 2px;
          transition: background 0.15s, color 0.15s;
        }
        .nav-btn:hover { background: ${dk ? "#1e2235" : "#f0f4f8"}; color: ${dk ? "#e2e8f0" : "#1a202c"}; }
        .nav-btn.active { background: ${dk ? "#1a2a50" : "#ebf4ff"}; color: #4f8ef7; font-weight: 600; }

        /* Theme toggle row */
        .theme-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid ${dk ? "#2d3354" : "#e2e8f0"};
        }
        .theme-label { font-size: 0.78rem; color: ${dk ? "#8892b0" : "#718096"}; }
        .toggle {
          width: 40px; height: 22px; border-radius: 11px; border: none;
          cursor: pointer; position: relative; transition: background 0.2s; padding: 0;
        }
        .toggle-dark { background: #4f8ef7; }
        .toggle-light { background: #cbd5e0; }
        .toggle-knob {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          transition: left 0.2s;
          left: ${dk ? "21px" : "3px"};
        }

        .legend { padding: 14px; flex: 1; overflow-y: auto; }
        .legend-title {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em;
          color: #4f8ef7; margin-bottom: 10px; font-weight: 700;
        }
        .legend-item {
          display: flex; align-items: center; gap: 8px;
          padding: 3px 0; font-size: 0.78rem;
          color: ${dk ? "#8892b0" : "#4a5568"};
        }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── Main area ── */
        .main-area { flex: 1; overflow-y: auto; background: ${dk ? "#0d1117" : "#f0f4f8"}; transition: background 0.2s; }

        /* ── Calendar layout ── */
        .cal-layout { display: flex; height: 100%; overflow: hidden; }
        .cal-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 20px 24px; }

        .cal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .cal-title { font-size: 1.3rem; font-weight: 700; color: ${dk ? "#e2e8f0" : "#1a202c"}; flex: 1; }
        .nav-arrow {
          background: ${dk ? "#1e2235" : "#ffffff"}; border: 1px solid ${dk ? "#2d3354" : "#d1d9e6"};
          color: ${dk ? "#e2e8f0" : "#1a202c"};
          width: 32px; height: 32px; border-radius: 6px; font-size: 1.1rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .nav-arrow:hover { background: ${dk ? "#2d3354" : "#e2e8f0"}; }
        .btn-today {
          background: transparent; border: 1px solid ${dk ? "#2d3354" : "#d1d9e6"};
          color: ${dk ? "#8892b0" : "#4a5568"};
          padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.82rem;
        }
        .btn-today:hover { color: ${dk ? "#e2e8f0" : "#1a202c"}; border-color: #4f8ef7; }
        .btn-refresh {
          background: transparent; border: 1px solid ${dk ? "#2d3354" : "#d1d9e6"};
          color: ${dk ? "#8892b0" : "#718096"};
          padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.78rem;
          white-space: nowrap;
        }
        .btn-refresh:hover { border-color: #4f8ef7; color: #4f8ef7; }
        .btn-add-top {
          background: #4f8ef7; color: #fff; border: none;
          padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
        }
        .btn-add-top:hover { background: #3a7de0; }

        .info-bar {
          padding: 8px 14px; border-radius: 6px; margin-bottom: 12px;
          font-size: 0.85rem; color: ${dk ? "#8892b0" : "#718096"};
          background: ${dk ? "#131929" : "#ffffff"}; border: 1px solid ${dk ? "#2d3354" : "#e2e8f0"};
        }
        .info-bar.error { color: #e53e3e; border-color: #e53e3e; }
        .info-bar button { background: none; border: none; color: #4f8ef7; cursor: pointer; text-decoration: underline; font-size: 0.85rem; }

        .dow-row { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid ${dk ? "#2d3354" : "#e2e8f0"}; margin-bottom: 4px; }
        .dow-cell { text-align: center; padding: 6px 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: ${dk ? "#8892b0" : "#a0aec0"}; }

        .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; flex: 1; overflow-y: auto; }
        .grid-cell {
          background: ${dk ? "#131929" : "#ffffff"};
          border: 1px solid ${dk ? "#1e2a40" : "#e8edf5"};
          border-radius: 6px; min-height: 90px; padding: 6px 7px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s; overflow: hidden;
        }
        .grid-cell.empty { background: transparent; border-color: transparent; cursor: default; }
        .grid-cell:not(.empty):hover { background: ${dk ? "#1a2040" : "#f7f9fc"}; border-color: ${dk ? "#2d3354" : "#c8d6e8"}; }
        .grid-cell.today { border-color: #4f8ef7; background: ${dk ? "#0f1d38" : "#ebf4ff"}; }
        .grid-cell.selected { border-color: #a5b4fc; background: ${dk ? "#1a2040" : "#f0f0ff"}; }
        .day-num { font-size: 0.8rem; font-weight: 600; color: ${dk ? "#8892b0" : "#a0aec0"}; margin-bottom: 4px; }
        .grid-cell.today .day-num { color: #4f8ef7; font-weight: 700; }

        .day-events { display: flex; flex-direction: column; gap: 2px; }
        .day-pill {
          font-size: 0.67rem; font-weight: 600; padding: 2px 5px; border-radius: 4px;
          border: 1px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;
        }
        .day-pill:hover { opacity: 0.75; }
        .more-pill { font-size: 0.65rem; color: ${dk ? "#8892b0" : "#a0aec0"}; padding: 1px 4px; }

        .side-panel {
          width: 300px; flex-shrink: 0;
          border-left: 1px solid ${dk ? "#2d3354" : "#e2e8f0"};
          background: ${dk ? "#131929" : "#ffffff"};
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .side-panel { width: 100%; position: fixed; bottom: 0; left: 0; right: 0; height: 50vh; z-index: 200; border-top: 1px solid ${dk ? "#2d3354" : "#e2e8f0"}; }
          .grid-cell { min-height: 60px; }
        }
      `}</style>
    </>
  );
}
