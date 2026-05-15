"use client";

import { useState, useRef, useEffect } from "react";
import type { AvailableInterest, ProfileInterest } from "@/lib/types";
import {
  getAllInterests,
  joinMyInterest,
  requestNewInterest,
} from "@/lib/data/interests";

interface Props {
  joined: ProfileInterest[];
  onJoin: (interest: ProfileInterest) => void;
  onClose: () => void;
}

const PREVIEW_COUNT = 12;

export default function InterestPickerModal({ joined, onJoin, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AvailableInterest | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [allInterests, setAllInterests] = useState<AvailableInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningName, setJoiningName] = useState("");
  const [joinedName, setJoinedName] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestDesc, setRequestDesc] = useState("");
  const [requestedInterestName, setRequestedInterestName] = useState("");
  const [requestAlreadyExists, setRequestAlreadyExists] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const returnDelayRef = useRef<number | null>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;

    getAllInterests()
      .then((interests) => {
        if (!active) return;
        setAllInterests(interests);
        setError("");
      })
      .catch(() => {
        if (active) setError("Unable to load interests.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (returnDelayRef.current) window.clearTimeout(returnDelayRef.current);
    };
  }, []);

  const joinedNames = new Set(joined.map((i) => i.name));
  if (joinedName) joinedNames.add(joinedName);
  const available = allInterests.filter((i) => !joinedNames.has(i.name));
  const isSearching = search.trim() !== "";
  const filtered = isSearching
    ? available.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : available;
  const visibleInterests = isSearching || showAll
    ? filtered
    : filtered.slice(0, PREVIEW_COUNT);

  const showRequest = isSearching && filtered.length === 0;
  const canRequestInterest = requestDesc.trim().length > 0;

  async function handleJoin(interest: AvailableInterest) {
    if (joiningName || joinedNames.has(interest.name)) return;

    setJoiningName(interest.name);

    try {
      const joinedInterest = await joinMyInterest(interest);
      onJoin(joinedInterest);
      setJoinedName(interest.name);
      returnDelayRef.current = window.setTimeout(() => {
        setDetail(null);
        setJoinedName("");
      }, 500);
    } finally {
      setJoiningName("");
    }
  }

  async function handleSendRequest() {
    if (!requestDesc.trim()) return;
    const requestedName = search.trim();
    setRequestSubmitting(true);
    setRequestError("");

    try {
      const result = await requestNewInterest(requestedName, requestDesc);
      setRequestedInterestName(requestedName);
      setRequestAlreadyExists(result.alreadyRequested);
      setRequestSent(true);
      setRequestDesc("");
    } catch {
      setRequestError("Unable to send this request. Please try again.");
    } finally {
      setRequestSubmitting(false);
    }
  }

  function requestAnotherInterest() {
    setRequestSent(false);
    setRequestedInterestName("");
    setRequestAlreadyExists(false);
    setRequestError("");
    setSearch("");
    setRequestDesc("");
    setShowAll(false);
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  /* ── Detail view ── */
  if (detail) {
    const isJoined = joinedNames.has(detail.name);
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col gap-[18px] p-6">
          {/* Back */}
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="flex items-center gap-1.5 self-start text-[12.5px] text-text-dimmed transition-colors hover:text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="h-4 w-4 shrink-0 rounded-full" style={{ background: detail.color }} />
            <div className="text-[20px] font-semibold">{detail.name}</div>
          </div>
          {/* Desc */}
          <div className="text-[14px] leading-relaxed text-text-secondary">
            {detail.desc || "Join this room to meet people who share this interest."}
          </div>
          {/* Members */}
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {detail.members} member{detail.members > 1 ? "s" : ""}
          </div>
          {/* Join btn */}
          <button
            type="button"
            disabled={Boolean(joiningName || isJoined)}
            onClick={() => {
              if (!isJoined) handleJoin(detail);
            }}
            className={`ml-auto mt-auto rounded-lg px-6 py-2.5 text-[13.5px] font-medium transition-opacity ${
              isJoined
                ? "cursor-default border border-accent-green/30 bg-bg-hover text-accent-green"
                : "bg-text-primary text-bg-primary hover:opacity-90 disabled:cursor-default disabled:opacity-70"
            }`}
          >
            {joiningName === detail.name ? "Joining..." : isJoined ? "Joined" : "Join"}
          </button>
        </div>
      </Overlay>
    );
  }

  if (requestSent) {
    return (
      <Overlay onClose={onClose}>
        <div className="flex items-center justify-between px-6 pb-1.5 pt-[22px]">
          <div className="text-[17px] font-semibold">Interest request sent</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-[20px] text-text-dimmed transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pb-6 pt-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent-green/30 bg-accent-green/10 text-[22px] font-semibold text-accent-green">
            ✓
          </div>
          <div className="text-[15px] font-medium text-text-primary">
            {requestAlreadyExists ? "Request already exists" : "We received your request"}
          </div>
          <div className="mt-2 max-w-[380px] text-[13px] leading-relaxed text-text-muted">
            {requestAlreadyExists && requestedInterestName ? (
              <>
                &quot;<span className="font-medium text-text-secondary">{requestedInterestName}</span>&quot; was already requested earlier. We kept it in review with your latest description.
              </>
            ) : requestedInterestName ? (
              <>
                &quot;<span className="font-medium text-text-secondary">{requestedInterestName}</span>&quot; will be reviewed before it appears in the interest list.
              </>
            ) : (
              "Your new interest suggestion will be reviewed before it appears in the interest list."
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={requestAnotherInterest}
              className="rounded-lg border border-border-default bg-transparent px-4 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-hover"
            >
              Request another
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-text-primary px-5 py-2 text-[13px] font-medium text-bg-primary transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  /* ── Grid view ── */
  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-1.5 pt-[22px]">
        <div className="text-[17px] font-semibold">Add an interest</div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-[20px] text-text-dimmed transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          ✕
        </button>
      </div>
      <div className="px-6 pb-[18px] text-[12.5px] text-text-muted">
        Join rooms that match your interests
      </div>

      {/* Search */}
      <input
        ref={searchRef}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowAll(false);
          setRequestSent(false);
          setRequestError("");
        }}
        placeholder="Search interests..."
        className="mx-6 mb-4 rounded-lg border border-border-default bg-bg-hover px-3.5 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
      />

      {/* Grid */}
      {loading && (
        <div className="px-6 pb-6 text-[13px] text-text-muted">
          Loading interests...
        </div>
      )}

      {error && (
        <div className="px-6 pb-6 text-[13px] text-danger">
          {error}
        </div>
      )}

      {!showRequest && (
        <div className="flex max-h-[320px] flex-wrap content-start gap-2 overflow-y-auto px-6 pb-5">
          {visibleInterests.map((i) => (
            <button
              key={i.name}
              type="button"
              onClick={() => setDetail(i)}
              className="flex items-center gap-2 rounded-full border border-border-default bg-bg-hover px-3.5 py-2 text-[13px] text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
            >
              <div className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: i.color }} />
              {i.name}
            </button>
          ))}
          {!isSearching && !showAll && filtered.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-full border border-dashed border-border-default px-3.5 py-2 text-[13px] text-text-dimmed transition-colors hover:border-solid hover:text-text-muted"
            >
              +{filtered.length - PREVIEW_COUNT} more
            </button>
          )}
        </div>
      )}

      {/* Request new interest */}
      {showRequest && !requestSent && (
        <div className="flex flex-col gap-3.5 px-6 pb-3.5">
          <div className="text-[14px] text-text-secondary">
            No results for &quot;<span className="font-semibold text-text-primary">{search}</span>&quot;
          </div>
          <textarea
            value={requestDesc}
            onChange={(e) => {
              setRequestDesc(e.target.value);
              setRequestError("");
            }}
            placeholder="Describe this interest briefly..."
            className="h-20 w-full resize-none rounded-lg border border-border-default bg-bg-hover px-3.5 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-dimmed focus:border-border-strong"
          />
          <div className="flex items-center justify-between gap-3">
            {requestError ? (
              <div className="text-[12px] text-danger">{requestError}</div>
            ) : (
              <div />
            )}
            <button
              type="button"
              disabled={!canRequestInterest || requestSubmitting}
              onClick={handleSendRequest}
              className="rounded-lg bg-text-primary px-[22px] py-2.5 text-[13px] font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-bg-hover disabled:text-text-dimmed disabled:hover:opacity-100"
            >
              {requestSubmitting ? "Sending..." : "Request a new interest"}
            </button>
          </div>
        </div>
      )}

    </Overlay>
  );
}

/* ── Overlay wrapper ── */
function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[80vh] w-[600px] flex-col overflow-hidden rounded-[14px] border border-border-default bg-bg-secondary shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {children}
      </div>
    </div>
  );
}
