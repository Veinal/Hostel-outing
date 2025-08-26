import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import "./GatePage.css"; // we'll add this tiny css in step 3

// Helper: format a Firestore timestamp/ISO string nicely
function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

// Lightweight toast that auto-hides
function Banner({ type, text }) {
  if (!type) return null;
  return (
    <div className={`gate-banner ${type === "GRANTED" ? "ok" : "bad"}`}>
      {text}
    </div>
  );
}

export default function GatePage() {
  const [lastEvent, setLastEvent] = useState(null);
  const [detail, setDetail] = useState(null); // merged student + warden + event
  const [recent, setRecent] = useState([]);
  const [banner, setBanner] = useState(null);
  const hideTimer = useRef(null);

  // Subscribe to latest gate event
  useEffect(() => {
    const q = query(
      collection(db, "gateLogs"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, async (snap) => {
      const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecent(events);

      const newest = events[0];
      if (!newest || (lastEvent && newest.id === lastEvent.id)) return;

      setLastEvent(newest);

      // Fetch student & warden details for the newest event
      const studentDoc = await getDoc(doc(db, "students", newest.studentId));
      const student = studentDoc.exists() ? studentDoc.data() : {};

      let wardenName = "—";
      if (newest.permissionId) {
        const permDoc = await getDoc(doc(db, "permissions", newest.permissionId));
        if (permDoc.exists()) {
          const perm = permDoc.data();
          if (perm.approvedByWardenId) {
            const wardenDoc = await getDoc(
              doc(db, "wardens", perm.approvedByWardenId)
            );
            if (wardenDoc.exists()) {
              wardenName = wardenDoc.data().name || "—";
            }
          }
        }
      }

      const merged = {
        eventId: newest.id,
        status: (newest.decision || "").toUpperCase(), // GRANTED / DENIED / EXPIRED
        mode:
          newest.decision === "granted"
            ? (newest.direction || "").toUpperCase() // OUT / IN
            : "",
        reason: newest.reason || "",
        when: newest.timestamp || null,

        // student fields
        photoUrl: student.photoUrl || "",
        name: student.name || "Unknown",
        usn: student.usn || "—",
        contact: student.contact || "—",
        roomNo: student.roomNo || "—",
        wardenName,
      };

      setDetail(merged);

      // Show banner for 2 seconds
      setBanner(
        merged.status === "GRANTED"
          ? `Permission Granted${merged.mode ? ` (${merged.mode})` : ""}`
          : merged.status === "EXPIRED"
          ? "Permission Expired"
          : `Not Approved${merged.reason ? ` — ${merged.reason}` : ""}`
      );
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setBanner(null), 2000);
    });

    return () => {
      clearTimeout(hideTimer.current);
      unsub();
    };
  }, []); // mount once

  const statusClass = useMemo(() => {
    if (!detail) return "";
    return detail.status === "GRANTED" ? "card-ok" : "card-bad";
  }, [detail]);

  return (
    <div className="gate-wrap">
      <header className="gate-top">
        <h1>Hostel Main Gate — Fingerprint</h1>
        <div className="live-dot">Live</div>
      </header>

      <main className="gate-main">
        {!detail ? (
          <div className="placeholder">Waiting for scan…</div>
        ) : (
          <div className={`card ${statusClass}`}>
            <div className="card-left">
              <img
                src={
                  detail.photoUrl ||
                  "https://dummyimage.com/256x256/eee/aaa.png&text=No+Photo"
                }
                alt="Student"
              />
            </div>
            <div className="card-right">
              <div className="row">
                <span className="lbl">Name</span>
                <span className="val">{detail.name}</span>
              </div>
              <div className="row">
                <span className="lbl">USN</span>
                <span className="val">{detail.usn}</span>
              </div>
              <div className="row">
                <span className="lbl">Contact</span>
                <span className="val">{detail.contact}</span>
              </div>
              <div className="row">
                <span className="lbl">Room</span>
                <span className="val">{detail.roomNo}</span>
              </div>
              <div className="row">
                <span className="lbl">Warden</span>
                <span className="val">{detail.wardenName}</span>
              </div>

              <div className="status">
                {detail.status === "GRANTED" ? (
                  <div className="ok-pill">
                    Permission Granted {detail.mode ? `(${detail.mode})` : ""}
                  </div>
                ) : detail.status === "EXPIRED" ? (
                  <div className="bad-pill">Permission Expired</div>
                ) : (
                  <div className="bad-pill">
                    Not Approved {detail.reason ? `— ${detail.reason}` : ""}
                  </div>
                )}
              </div>
              <div className="ts">Time: {fmt(detail.when)}</div>
            </div>
          </div>
        )}

        <section className="recent">
          <h2>Recent Scans</h2>
          <div className="recent-list">
            {recent.map((e) => (
              <div key={e.id} className="recent-item">
                <div
                  className={`dot ${
                    e.decision === "granted" ? "ok-dot" : "bad-dot"
                  }`}
                />
                <div className="recent-main">
                  <div className="recent-title">
                    {e.studentId} {e.decision === "granted" ? `(${(e.direction || "").toUpperCase()})` : `(${(e.decision || "").toUpperCase()})`}
                  </div>
                  <div className="recent-sub">{fmt(e.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Banner
        type={detail?.status === "GRANTED" ? "GRANTED" : detail ? "DENIED" : ""}
        text={banner}
      />
    </div>
  );
}
