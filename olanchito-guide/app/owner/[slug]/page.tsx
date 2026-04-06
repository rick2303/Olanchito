"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CatalogManager from "@/components/owner/CatalogManager";
import OffersManager from "@/components/owner/OffersManager";
import PhotoGallery from "@/components/owner/PhotoGallery";
import InactivityGuard from "@/components/InactivityGuard";
import LocationPickerWrapper from "@/components/LocationPickerWrapper";
import type { LatLng } from "@/components/LocationPicker";
import {
  BuildingStorefrontIcon,
  BookOpenIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ArrowUpCircleIcon,
  XCircleIcon,
  XMarkIcon,
  TagIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";

function getPublicUrl(path: string | null) {
  if (!path) return null;
  const cleanPath = path.startsWith("business/") ? path : `business/${path}`;
  return supabase.storage.from(BUCKET).getPublicUrl(cleanPath).data.publicUrl;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hours: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  image: string | null;
  services: string[] | null;
  socials: Record<string, string | null> | null;
  location: LatLng | null;
  view_count: number;
  subscription_active: boolean;
  subscription_tier: "free" | "premium" | "featured";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
  booking_url: string | null;
  announcement: string | null;
  announcement_expires_at: string | null;
  owner_email: string | null;
}

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  owner_reply: string | null;
}

type Tab = "info" | "catalog" | "photos" | "stats" | "announcement" | "offers" | "settings";

export default function OwnerDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  // Info form state
  const [infoForm, setInfoForm] = useState({
    description: "",
    hours: "",
    phone: "",
    whatsapp: "",
    address: "",
    services: "",
    booking_url: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
    website: "",
  });

  const [location, setLocation] = useState<LatLng | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<null | "premium" | "featured">(null);
  const [upgradeError, setUpgradeError] = useState("");

  // Global toast — visible on all tabs (used for payment confirmation)
  const [globalToast, setGlobalToast] = useState<{ type: "ok" | "err" | "info"; msg: string } | null>(null);
  const showGlobalToast = (type: "ok" | "err" | "info", msg: string, duration = 6000) => {
    setGlobalToast({ type, msg });
    if (duration > 0) setTimeout(() => setGlobalToast(null), duration);
  };


  // Events for detailed stats (featured only, lazy loaded)
  const [events, setEvents] = useState<{ event_type: string; created_at: string }[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Announcement state (featured only)
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementExpires, setAnnouncementExpires] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementDirty, setAnnouncementDirty] = useState(false);

  // Subscription management
  const [subAction, setSubAction] = useState<null | "cancel" | "upgrade">(null);
  const [subLoading, setSubLoading] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);
  const [subToast, setSubToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showSubToast = (type: "ok" | "err", msg: string) => {
    setSubToast({ type, msg });
    setTimeout(() => setSubToast(null), 12000);
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json" as const,
      ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
    };
  };

  const handleSwitchPlan = async (newTier: "featured") => {
    if (!business) return;
    setSwitchingPlan(true);
    const headers = await getAuthHeaders();
    const res = await fetch("/api/stripe/upgrade", {
      method: "POST",
      headers,
      body: JSON.stringify({ business_id: business.id, new_tier: newTier }),
    });
    const data = await res.json().catch(() => ({ error: "Error del servidor. Intenta de nuevo." }));
    setSwitchingPlan(false);
    if (!res.ok) {
      showSubToast("err", data.error ?? "Error al cambiar de plan. Intenta de nuevo.");
      return;
    }
    setSubAction(null);
    setBusiness(prev => prev ? { ...prev, subscription_tier: newTier, featured: true } : prev);
    showSubToast("ok", "¡Plan actualizado a Destacado! Los cambios ya están activos.");
  };

  const handleCancel = async () => {
    if (!business) return;
    setSubLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers,
      body: JSON.stringify({ business_id: business.id }),
    });
    const data = await res.json().catch(() => ({ error: "Error del servidor. Intenta de nuevo." }));
    setSubLoading(false);
    setSubAction(null);
    if (!res.ok) { showSubToast("err", data.error ?? "Error al cancelar."); return; }
    if (data.immediate) {
      // Manual subscriber — deactivated now
      setBusiness(prev => prev ? {
        ...prev,
        subscription_active: false,
        subscription_tier: "free",
        featured: false,
        cancel_at_period_end: false,
      } : prev);
    } else {
      // Stripe subscriber — still active until period ends, mark in local state
      setBusiness(prev => prev ? { ...prev, cancel_at_period_end: true } : prev);
    }
  };

  // Review replies
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReply, setSavingReply] = useState<string | null>(null);
  const [savedReplyIds, setSavedReplyIds] = useState<Set<string>>(new Set());
  const [editingReplyIds, setEditingReplyIds] = useState<Set<string>>(new Set());
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoToast, setInfoToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showInfoToast = (type: "ok" | "err", msg: string) => {
    setInfoToast({ type, msg });
    setTimeout(() => setInfoToast(null), 3500);
  };

  // Auth + data load
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/owner/login"); return; }

      // Force password creation if the user clicked an invite link but skipped setup
      if (!session.user.user_metadata?.has_password) {
        router.replace("/owner/setup");
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, description, hours, phone, whatsapp, address, image, services, socials, location, view_count, subscription_active, subscription_tier, stripe_customer_id, stripe_subscription_id, cancel_at_period_end, booking_url, announcement, announcement_expires_at, owner_email")
        .eq("slug", slug)
        .single();

      if (!biz || biz.owner_email?.toLowerCase() !== session.user.email?.toLowerCase()) {
        router.replace("/owner/login");
        return;
      }

      setBusiness(biz as Business);
      populateForm(biz);
      setAnnouncementText(biz.announcement ?? "");
      setAnnouncementExpires(
        biz.announcement_expires_at
          ? new Date(biz.announcement_expires_at).toISOString().split("T")[0]
          : ""
      );
      setAnnouncementDirty(false);
      setImagePreview(getPublicUrl(biz.image));

      const { data: rev } = await supabase
        .from("reviews")
        .select("id, author_name, rating, comment, created_at, owner_reply")
        .eq("business_slug", slug)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });
      setReviews(rev ?? []);

      setLoading(false);

      // Detect return from Stripe checkout (success_url includes ?upgraded=true)
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgraded") === "true") {
        router.replace(`/owner/${slug}`);

        if (biz.subscription_active) {
          // Webhook already fired before redirect — immediate success
          showGlobalToast("ok", "¡Plan activado! Tu suscripción ya está activa.");
        } else {
          // Webhook hasn't fired yet — poll DB until it updates (max ~8 seconds)
          showGlobalToast("info", "Verificando tu pago con Stripe...", 0);
          let attempts = 0;
          const pollPayment = async () => {
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
            const { data: fresh } = await supabase
              .from("businesses")
              .select("subscription_active, subscription_tier, featured, stripe_customer_id, stripe_subscription_id, cancel_at_period_end")
              .eq("id", biz.id)
              .single();
            if (fresh?.subscription_active) {
              setBusiness(prev => prev ? { ...prev, ...fresh } : prev);
              showGlobalToast("ok", "¡Plan activado! Tu suscripción ya está activa.");
            } else if (attempts < 4) {
              pollPayment();
            } else {
              showGlobalToast("err", "No pudimos confirmar el pago aún. Recarga la página en unos segundos.", 10000);
            }
          };
          pollPayment();
        }
      }
    };
    load();
  }, [slug, router]);

  const handleImageChange = (file: File) => {
    setNewImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const handleInfoChange = (updater: (f: typeof infoForm) => typeof infoForm) => {
    setInfoForm(updater);
    setIsDirty(true);
  };

  const handleLocationChange = (loc: LatLng | null) => {
    setLocation(loc);
    setIsDirty(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const populateForm = (biz: any) => {
    const socials = (biz.socials as Record<string, string | null> | null) ?? {};
    setInfoForm({
      description: biz.description ?? "",
      hours: biz.hours ?? "",
      phone: biz.phone ?? "",
      whatsapp: biz.whatsapp ?? "",
      address: biz.address ?? "",
      services: Array.isArray(biz.services) ? (biz.services as string[]).join(", ") : "",
      booking_url: biz.booking_url ?? "",
      instagram: socials.instagram ?? "",
      facebook: socials.facebook ?? "",
      tiktok: socials.tiktok ?? "",
      linkedin: socials.linkedin ?? "",
      website: socials.website ?? "",
    });
    setLocation((biz.location as LatLng | null) ?? null);
    setNewImageFile(null);
    setImagePreview(getPublicUrl(biz.image));
    setIsDirty(false);
  };

  const handleDiscard = async () => {
    if (!business) return;
    setDiscarding(true);
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, description, hours, phone, whatsapp, address, image, services, socials, location, view_count, subscription_active, subscription_tier, stripe_customer_id, booking_url, announcement, announcement_expires_at, owner_email")
      .eq("id", business.id)
      .single();
    if (biz) populateForm(biz);
    setDiscarding(false);
  };

  const handleDirectCheckout = async (checkoutTier: "premium" | "featured") => {
    if (!business?.owner_email) return;
    setUpgradeLoading(checkoutTier);
    setUpgradeError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: business.owner_email,
          tier: checkoutTier,
          business_id: business.id,
          return_slug: slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeError(data.error ?? "Error al iniciar el pago. Intenta de nuevo.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setUpgradeError("Error de conexión. Intenta de nuevo.");
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSavingInfo(true);

    let imagePath = business.image;

    try {
      if (newImageFile) {
        // Delete old image
        if (business.image) {
          const oldPath = business.image.startsWith("business/") ? business.image : `business/${business.image}`;
          await supabase.storage.from(BUCKET).remove([oldPath]);
        }
        const ext = newImageFile.name.split(".").pop();
        const newPath = `business/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(newPath, newImageFile);
        if (uploadError) throw uploadError;
        imagePath = newPath;
      }

      const services = infoForm.services
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const socials = {
        instagram: infoForm.instagram.trim() || null,
        facebook: infoForm.facebook.trim() || null,
        tiktok: infoForm.tiktok.trim() || null,
        linkedin: infoForm.linkedin.trim() || null,
        website: infoForm.website.trim() || null,
      };

      const { error } = await supabase
        .from("businesses")
        .update({
          description: infoForm.description.trim() || null,
          hours: infoForm.hours.trim() || null,
          phone: infoForm.phone.trim() || null,
          whatsapp: infoForm.whatsapp.trim() || null,
          address: infoForm.address.trim() || null,
          services,
          socials,
          location: location ?? null,
          image: imagePath,
          booking_url: infoForm.booking_url.trim() || null,
        })
        .eq("id", business.id);

      if (error) throw error;

      setBusiness(prev => prev ? { ...prev, image: imagePath } : prev);
      if (imagePath) setImagePreview(getPublicUrl(imagePath));
      setNewImageFile(null);
      setIsDirty(false);
      showInfoToast("ok", "Información actualizada correctamente.");
      revalidatePublicPage(slug as string);
    } catch {
      showInfoToast("err", "Error al guardar. Intenta de nuevo.");
    } finally {
      setSavingInfo(false);
    }
  };

  const revalidatePublicPage = (businessSlug: string) => {
    fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: businessSlug }),
    }).catch(() => { });
  };

  const handleSaveAnnouncement = async () => {
    if (!business) return;
    setSavingAnnouncement(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        announcement: announcementText.trim() || null,
        announcement_expires_at: announcementExpires
          ? new Date(announcementExpires + "T23:59:59").toISOString()
          : null,
      })
      .eq("id", business.id);

    if (error) {
      showInfoToast("err", `Error al guardar: ${error.message}`);
      setSavingAnnouncement(false);
      return;
    }

    setBusiness(prev => prev ? {
      ...prev,
      announcement: announcementText.trim() || null,
      announcement_expires_at: announcementExpires
        ? new Date(announcementExpires + "T23:59:59").toISOString()
        : null,
    } : prev);
    setSavingAnnouncement(false);
    setAnnouncementDirty(false);
    showInfoToast("ok", "Anuncio publicado.");
    revalidatePublicPage(slug as string);
  };

  const handleSaveReply = async (reviewId: string) => {
    // Use the draft if the user has typed, otherwise fall back to the existing saved reply
    const existing = reviews.find(r => r.id === reviewId)?.owner_reply ?? "";
    const text = (reviewId in replyDrafts ? replyDrafts[reviewId] : existing).trim();
    setSavingReply(reviewId);
    await supabase
      .from("reviews")
      .update({ owner_reply: text || null, owner_reply_at: text ? new Date().toISOString() : null })
      .eq("id", reviewId);
    // Update review state and clear draft + editing mode
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, owner_reply: text || null } : r));
    setReplyDrafts(prev => { const next = { ...prev }; delete next[reviewId]; return next; });
    setEditingReplyIds(prev => { const next = new Set(prev); next.delete(reviewId); return next; });
    // Flash "saved" for 2.5s
    setSavedReplyIds(prev => new Set([...prev, reviewId]));
    setTimeout(() => setSavedReplyIds(prev => { const next = new Set(prev); next.delete(reviewId); return next; }), 2500);
    setSavingReply(null);
    revalidatePublicPage(slug as string);
  };

  // Lazy-load events for detailed stats (featured only, fires once when stats tab opens)
  useEffect(() => {
    if (activeTab !== "stats" || !business || events !== null) return;
    const tier = business.subscription_tier ?? "free";
    if (tier !== "featured") return;
    setEventsLoading(true);
    supabase
      .from("business_events")
      .select("event_type, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEvents(data ?? []);
        setEventsLoading(false);
      });
  }, [activeTab, business, events]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/owner/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-jungle-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-jungle-200 border-t-jungle-600" />
      </main>
    );
  }

  if (!business) return null;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const tier = business.subscription_tier ?? "free";
  const maxPhotos = tier === "featured" ? 15 : 5;
  const maxItems: number | null = tier === "featured" ? null : 10;

  const isPaid = business.subscription_active && tier !== "free";

  // Free users can only access info + settings
  const tabAllowed = (tabId: Tab) => {
    if (tabId === "info" || tabId === "settings") return true;
    if (tabId === "stats" || tabId === "catalog" || tabId === "photos") return isPaid;
    if (tabId === "announcement" || tabId === "offers") return tier === "featured";
    return false;
  };

  const effectiveTab = tabAllowed(activeTab) ? activeTab : "info";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Mi Negocio", icon: <BuildingStorefrontIcon className="h-4 w-4" /> },
    { id: "catalog", label: "Catálogo", icon: <BookOpenIcon className="h-4 w-4" /> },
    { id: "photos", label: "Fotos", icon: <PhotoIcon className="h-4 w-4" /> },
    { id: "stats", label: "Estadísticas", icon: <ChartBarIcon className="h-4 w-4" /> },
    ...(tier === "featured"
      ? [
        { id: "announcement" as Tab, label: "Anuncio", icon: <SparklesIcon className="h-4 w-4" /> },
        { id: "offers" as Tab, label: "Ofertas", icon: <TagIcon className="h-4 w-4" /> },
      ]
      : []),
    { id: "settings", label: "Configuración", icon: <Cog6ToothIcon className="h-4 w-4" /> },
  ];

  return (
    <main className="min-h-screen bg-jungle-50">
      <InactivityGuard redirectTo="/owner/login" />
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src="/colibri.webp" alt="Olanchito" width={28} height={28} className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-jungle-950 leading-tight" style={{ fontFamily: "var(--font-syne)" }}>
                {business.name}
              </p>
              <p className="text-[10px] text-jungle-500">Portal del negocio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/negocios/${slug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-jungle-50 px-3 py-1.5 text-xs font-semibold text-jungle-800 ring-1 ring-jungle-200 hover:bg-jungle-100"
            >
              Ver página pública
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-jungle-600 hover:bg-jungle-50"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Upgrade nudge for free tier */}
      {!isPaid && (
        <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-jungle-900 px-5 py-3.5">
            <p className="text-xs text-jungle-300">
              <span className="font-bold text-white">Plan Gratuito</span> — Activa Premium para subir fotos, catálogo y más.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-jungle-950 hover:bg-jungle-100 transition-colors"
            >
              Ver planes
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Global toast — always visible regardless of active tab */}
        {globalToast && (
          <div className={`mb-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 ring-1 ${globalToast.type === "ok" ? "bg-green-50 ring-green-200 text-green-800" :
            globalToast.type === "err" ? "bg-red-50 ring-red-200 text-red-800" :
              "bg-jungle-50 ring-jungle-200 text-jungle-800"
            }`}>
            {globalToast.type === "ok"
              ? <CheckIcon className="h-4 w-4 flex-shrink-0" />
              : globalToast.type === "err"
                ? <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                : <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-jungle-500 border-t-transparent" />
            }
            <p className="text-xs font-semibold">{globalToast.msg}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-black/5 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => tabAllowed(tab.id) && setActiveTab(tab.id)}
              disabled={!tabAllowed(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 sm:gap-1.5 sm:px-3 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${effectiveTab === tab.id
                  ? "bg-jungle-800 text-white shadow"
                  : "text-jungle-600 hover:bg-jungle-50"
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {!tabAllowed(tab.id) && (
                <span className="hidden sm:inline ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {effectiveTab === "info" && (
          <form onSubmit={handleSaveInfo} className="space-y-5">
            {/* Toast */}
            {infoToast && (
              <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ring-1 ${infoToast.type === "ok"
                ? "bg-green-50 ring-green-200 text-green-800"
                : "bg-red-50 ring-red-200 text-red-800"
                }`}>
                {infoToast.type === "ok"
                  ? <CheckIcon className="h-4 w-4 flex-shrink-0" />
                  : <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />}
                <p className="text-xs font-semibold">{infoToast.msg}</p>
              </div>
            )}

            {/* Image */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-4 text-sm font-bold text-jungle-950">Foto del negocio</h3>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-jungle-50 ring-1 ring-jungle-200 hover:ring-jungle-400 transition-all"
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-jungle-400">
                    <ArrowUpTrayIcon className="h-8 w-8" />
                    <span className="text-xs font-semibold">Subir foto</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent pb-3 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-white">Cambiar foto</span>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
              />
            </div>

            {/* Basic info */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-4 text-sm font-bold text-jungle-950">Información básica</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Descripción</label>
                  <textarea
                    value={infoForm.description}
                    onChange={(e) => handleInfoChange(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe tu negocio..."
                    className="field resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Horario de atención</label>
                  <input
                    type="text"
                    value={infoForm.hours}
                    onChange={(e) => handleInfoChange(f => ({ ...f, hours: e.target.value }))}
                    placeholder="Ej: Lun-Vie 8am-6pm, Sáb 8am-12pm"
                    className="field"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-jungle-900">Teléfono</label>
                    <input
                      type="text"
                      value={infoForm.phone}
                      onChange={(e) => handleInfoChange(f => ({ ...f, phone: e.target.value }))}
                      placeholder="9999-9999"
                      className="field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-jungle-900">WhatsApp</label>
                    <input
                      type="text"
                      value={infoForm.whatsapp}
                      onChange={(e) => handleInfoChange(f => ({ ...f, whatsapp: e.target.value }))}
                      placeholder="9999-9999"
                      className="field"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Dirección</label>
                  <input
                    type="text"
                    value={infoForm.address}
                    onChange={(e) => handleInfoChange(f => ({ ...f, address: e.target.value }))}
                    placeholder="Barrio, calle, referencia..."
                    className="field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Servicios / Productos</label>
                  <input
                    type="text"
                    value={infoForm.services}
                    onChange={(e) => handleInfoChange(f => ({ ...f, services: e.target.value }))}
                    placeholder="Separados por coma: Ropa, Zapatos, Accesorios"
                    className="field"
                  />
                  <p className="text-[10px] text-jungle-500">Separa cada item con una coma.</p>
                </div>
              </div>
            </div>

            {/* Redes sociales — Free+ */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-4 text-sm font-bold text-jungle-950">Redes sociales y web</h3>
              <div className="space-y-3">
                {[
                  { key: "instagram", label: "Instagram", placeholder: "instagram.com/tunegocio" },
                  { key: "facebook", label: "Facebook", placeholder: "facebook.com/tunegocio" },
                  { key: "tiktok", label: "TikTok", placeholder: "tiktok.com/@tunegocio" },
                  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/..." },
                  { key: "website", label: "Sitio web", placeholder: "tunegocio.com" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-jungle-900">{label}</label>
                    <input
                      type="text"
                      inputMode="url"
                      value={infoForm[key as keyof typeof infoForm]}
                      onChange={(e) => handleInfoChange(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="field"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ubicación en el mapa — Free+ */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-jungle-950">Ubicación en el mapa</h3>
                <p className="mt-1 text-xs text-jungle-500">Busca tu dirección o haz clic en el mapa para colocar el pin.</p>
              </div>
              <LocationPickerWrapper value={location} onChange={handleLocationChange} />
            </div>

            {/* Reservas — Premium+ */}
            <div className={`rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${!isPaid ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-bold text-jungle-950">Link de reserva / cita</h3>
                {!isPaid && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Premium</span>}
              </div>
              <p className="mb-4 text-xs text-jungle-500">Aparece como botón &quot;Agendar cita&quot; en tu página pública. Puede ser un link de Calendly, WhatsApp, o cualquier otro servicio.</p>
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={infoForm.booking_url}
                onChange={(e) => handleInfoChange(f => ({ ...f, booking_url: e.target.value }))}
                placeholder="calendly.com/tunegocio o wa.me/504..."
                className="field"
                disabled={!isPaid}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingInfo || !isDirty}
                className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingInfo ? "Guardando..." : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    {isDirty ? "Guardar cambios" : "Sin cambios pendientes"}
                  </>
                )}
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={savingInfo || discarding}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {discarding ? "Restaurando..." : "Descartar"}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── CATALOG TAB ── */}
        {effectiveTab === "catalog" && (
          <div>
            <div className="mb-5 rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-bold text-jungle-950">Catálogo de productos y servicios</p>
              <p className="mt-1 text-xs text-jungle-600">
                Los items disponibles se muestran a tus clientes en tu página pública.
                {maxItems !== null && <span className="ml-1 font-semibold">Máximo {maxItems} items en tu plan.</span>}
                {maxItems === null && <span className="ml-1 font-semibold text-amber-700">Items ilimitados en tu plan.</span>}
              </p>
            </div>
            <CatalogManager businessId={business.id} slug={business.slug} maxItems={maxItems} />
          </div>
        )}

        {/* ── PHOTOS TAB ── */}
        {effectiveTab === "photos" && (
          <div>
            <div className="mb-5 rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-bold text-jungle-950">Galería de fotos</p>
              <p className="mt-1 text-xs text-jungle-600">
                Las fotos se muestran en tu página pública. Máximo <span className="font-semibold">{maxPhotos}</span> fotos en tu plan.
              </p>
            </div>
            <PhotoGallery businessId={business.id} slug={business.slug} maxPhotos={maxPhotos} />
          </div>
        )}

        {/* ── STATS TAB ── */}
        {effectiveTab === "stats" && (
          <div className="space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                icon={<EyeIcon className="h-5 w-5 text-jungle-600" />}
                label="Vistas totales"
                value={business.view_count.toLocaleString()}
              />
              <StatCard
                icon={<ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-jungle-600" />}
                label="Reseñas"
                value={reviews.length.toString()}
              />
              <StatCard
                icon={<StarIcon className="h-5 w-5 text-jungle-600" />}
                label="Calificación"
                value={reviews.length ? avgRating.toFixed(1) : "—"}
                sub={reviews.length ? "/ 5.0" : "Sin reseñas"}
              />
            </div>

            {/* Detailed click stats — featured only */}
            {tier === "featured" && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <p className="mb-4 text-sm font-bold text-jungle-950">Clics de contacto</p>
                {eventsLoading ? (
                  <p className="text-sm text-jungle-400">Cargando estadísticas...</p>
                ) : events !== null ? (() => {
                  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                  const waTotal = events.filter(e => e.event_type === "whatsapp_click").length;
                  const waWeek = events.filter(e => e.event_type === "whatsapp_click" && e.created_at >= oneWeekAgo).length;
                  const phTotal = events.filter(e => e.event_type === "phone_click").length;
                  const phWeek = events.filter(e => e.event_type === "phone_click" && e.created_at >= oneWeekAgo).length;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />}
                        label="Clics WhatsApp"
                        value={waTotal.toLocaleString()}
                        sub={`${waWeek} esta semana`}
                      />
                      <StatCard
                        icon={<PhoneIcon className="h-5 w-5 text-jungle-600" />}
                        label="Clics Teléfono"
                        value={phTotal.toLocaleString()}
                        sub={`${phWeek} esta semana`}
                      />
                    </div>
                  );
                })() : null}
              </div>
            )}

            {/* Reviews list */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-4 text-sm font-bold text-jungle-950">
                Reseñas recientes ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-jungle-500">Aún no tienes reseñas.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => {
                    const isEditing = editingReplyIds.has(r.id);
                    const justSaved = savedReplyIds.has(r.id);
                    const isSaving = savingReply === r.id;
                    const draft = replyDrafts[r.id] ?? r.owner_reply ?? "";
                    const hasReply = !!r.owner_reply;
                    const showForm = isEditing || !hasReply;

                    return (
                      <div key={r.id} className="rounded-2xl bg-jungle-50 p-4 ring-1 ring-jungle-100">
                        {/* Review header */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-jungle-900">{r.author_name}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarSolid key={i} className={`h-3 w-3 ${i < r.rating ? "text-amber-400" : "text-jungle-200"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="mt-1.5 text-xs leading-relaxed text-jungle-700">{r.comment}</p>
                        )}
                        <p className="mt-2 text-[10px] text-jungle-400">
                          {new Date(r.created_at).toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
                        </p>

                        {/* Reply section */}
                        <div className="mt-3 border-t border-jungle-200 pt-3">
                          <p className="mb-2 text-[10px] font-semibold text-jungle-600">Tu respuesta</p>

                          {/* Saved state — reply exists and not editing */}
                          {!showForm && (
                            <div className={`flex items-start gap-2 rounded-xl p-3 ring-1 transition-colors ${justSaved ? "bg-green-50 ring-green-200" : "bg-jungle-100 ring-jungle-200"
                              }`}>
                              {justSaved && <CheckIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-600" />}
                              <p className="min-w-0 flex-1 text-xs leading-relaxed text-jungle-800">{r.owner_reply}</p>
                              <button
                                onClick={() => setEditingReplyIds(prev => new Set([...prev, r.id]))}
                                className="flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-jungle-600 hover:bg-jungle-200"
                              >
                                Editar
                              </button>
                            </div>
                          )}

                          {/* Just saved flash without existing text (reply was deleted) */}
                          {justSaved && !r.owner_reply && (
                            <p className="text-[10px] font-semibold text-green-600">✓ Respuesta eliminada</p>
                          )}

                          {/* Edit form */}
                          {showForm && (
                            <>
                              <textarea
                                value={draft}
                                onChange={(e) => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                                rows={2}
                                placeholder="Escribe una respuesta pública..."
                                className="field resize-none text-xs"
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => handleSaveReply(r.id)}
                                  disabled={isSaving}
                                  className="rounded-xl bg-jungle-700 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-jungle-800 disabled:opacity-50"
                                >
                                  {isSaving ? "Guardando..." : "Publicar respuesta"}
                                </button>
                                {hasReply && (
                                  <button
                                    onClick={() => {
                                      setEditingReplyIds(prev => { const n = new Set(prev); n.delete(r.id); return n; });
                                      setReplyDrafts(prev => { const n = { ...prev }; delete n[r.id]; return n; });
                                    }}
                                    className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-jungle-500 ring-1 ring-jungle-200 hover:bg-jungle-100"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENT TAB (featured only) ── */}
        {effectiveTab === "announcement" && tier === "featured" && (
          <div className="space-y-5">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="mb-1 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-jungle-950">Anuncio temporal</h3>
              </div>
              <p className="mb-5 text-xs text-jungle-500">
                Aparece como un banner destacado en tu página pública. Ideal para promociones, novedades o avisos importantes. Desaparece automáticamente en la fecha de expiración.
              </p>

              {/* Estado: publicado y sin cambios */}
              {!announcementDirty && business.announcement && (() => {
                const expired = business.announcement_expires_at
                  ? new Date(business.announcement_expires_at) < new Date()
                  : false;
                return expired ? (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl bg-jungle-50 p-4 ring-1 ring-jungle-200">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-jungle-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-jungle-800">Anuncio expirado</p>
                      <p className="mt-0.5 text-xs text-jungle-600">Ya no se muestra en la página pública. Puedes publicar uno nuevo o eliminarlo.</p>
                    </div>
                    <button
                      onClick={() => setAnnouncementDirty(true)}
                      className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold text-jungle-700 ring-1 ring-jungle-300 hover:bg-jungle-100"
                    >
                      Nuevo
                    </button>
                  </div>
                ) : (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
                    <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-green-800">Anuncio publicado</p>
                      <p className="mt-0.5 text-xs text-green-700 line-clamp-2">{business.announcement}</p>
                      {business.announcement_expires_at && (
                        <p className="mt-1 text-[10px] text-green-600">
                          Expira: {new Date(business.announcement_expires_at).toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setAnnouncementDirty(true)}
                      className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold text-green-700 ring-1 ring-green-300 hover:bg-green-100"
                    >
                      Editar
                    </button>
                  </div>
                );
              })()}

              <div className={`space-y-4 ${!announcementDirty && business.announcement ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Mensaje del anuncio</label>
                  <textarea
                    value={announcementText}
                    onChange={(e) => { setAnnouncementText(e.target.value); setAnnouncementDirty(true); }}
                    rows={3}
                    placeholder="Ej: ¡Promoción de verano! 20% de descuento en todos los productos esta semana."
                    className="field resize-none"
                    maxLength={280}
                  />
                  <p className="text-[10px] text-jungle-400">{announcementText.length} / 280 caracteres</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Fecha de expiración (opcional)</label>
                  <input
                    type="date"
                    value={announcementExpires}
                    onChange={(e) => { setAnnouncementExpires(e.target.value); setAnnouncementDirty(true); }}
                    className="field"
                  />
                  <p className="text-[10px] text-jungle-400">Si no se establece, el anuncio se muestra indefinidamente.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAnnouncement}
                    disabled={savingAnnouncement || !announcementText.trim()}
                    className="btn-primary flex-1 py-2.5 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {savingAnnouncement ? "Guardando..." : "Publicar anuncio"}
                  </button>
                  {business.announcement && (
                    <button
                      disabled={savingAnnouncement}
                      onClick={async () => {
                        setAnnouncementText("");
                        setAnnouncementExpires("");
                        setAnnouncementDirty(false);
                        setSavingAnnouncement(true);
                        await supabase
                          .from("businesses")
                          .update({ announcement: null, announcement_expires_at: null })
                          .eq("id", business.id);
                        setBusiness(prev => prev ? { ...prev, announcement: null, announcement_expires_at: null } : prev);
                        setSavingAnnouncement(false);
                        showInfoToast("ok", "Anuncio eliminado.");
                        revalidatePublicPage(slug as string);
                      }}
                      className="btn-secondary px-4 py-2.5 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            {announcementText && (
              <div className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">Vista previa del anuncio</p>
                <p className="text-sm font-semibold text-amber-900">{announcementText}</p>
                {announcementExpires && (
                  <p className="mt-1 text-[10px] text-amber-600">
                    Expira: {new Date(announcementExpires + "T12:00:00").toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {/* ── OFFERS TAB (featured only) ── */}
        {effectiveTab === "offers" && tier === "featured" && (
          <div>
            <div className="mb-5 rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-bold text-jungle-950">Ofertas y Promociones</p>
              <p className="mt-1 text-xs text-jungle-600">
                Las ofertas activas se muestran en tu página pública. Puedes configurar precios, badges y fecha de vencimiento.
              </p>
            </div>
            <OffersManager businessId={business.id} slug={business.slug} />
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {effectiveTab === "settings" && (
          <div className="space-y-5">
            {/* Toast */}
            {subToast && (
              <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ring-1 ${subToast.type === "ok"
                ? "bg-green-50 ring-green-200 text-green-800"
                : "bg-red-50 ring-red-200 text-red-800"
                }`}>
                {subToast.type === "ok"
                  ? <CheckIcon className="h-4 w-4 flex-shrink-0" />
                  : <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />}
                <p className="text-xs font-semibold">{subToast.msg}</p>
              </div>
            )}

            {/* Current plan */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3 className="mb-4 text-sm font-bold text-jungle-950">Tu suscripción</h3>
              <div className="flex items-center justify-between rounded-2xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-100">
                <div>
                  <p className="text-xs text-jungle-500">Plan actual</p>
                  <p className="text-sm font-bold text-jungle-950 capitalize">
                    {tier === "featured" ? "Destacado" : tier === "premium" ? "Premium" : "Gratuito"}
                    {tier !== "free" && (
                      <span className="ml-2 text-[10px] font-semibold text-jungle-500">
                        {tier === "featured" ? "$10/mes" : "$6/mes"}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${business.subscription_active
                  ? "bg-green-100 text-green-700"
                  : "bg-jungle-100 text-jungle-500"
                  }`}>
                  {business.subscription_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            {/* Upgrade to Destacado — hide if cancellation already scheduled */}
            {business.subscription_active && tier === "premium" && !business.cancel_at_period_end && (
              <div className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircleIcon className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-jungle-950">Mejorar a Destacado</h3>
                  </div>
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">$10/mes</span>
                </div>
                <p className="mb-4 mt-1 text-xs text-jungle-600">
                  Accede a todas las funciones del plan más completo.
                </p>

                {subAction === "upgrade" ? (
                  /* ── Confirmation step ── */
                  business.stripe_subscription_id ? (
                    /* Stripe subscriber — show proration charge explanation */
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-300 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-jungle-950">Se realizará un cobro inmediato</p>
                          <p className="text-xs leading-relaxed text-jungle-700">
                            Al confirmar, Stripe te cobrará <span className="font-bold">ahora mismo</span> la diferencia proporcional entre tu plan Premium ($6/mes) y el plan Destacado ($10/mes), calculada según los días que quedan en tu ciclo de facturación actual.
                          </p>
                          <p className="text-xs leading-relaxed text-jungle-700">
                            A partir del siguiente ciclo, tu suscripción mensual pasará a <span className="font-bold">$10/mes</span>.
                          </p>
                          <p className="text-[11px] text-jungle-500 pt-1">
                            El cargo aparecerá en tu tarjeta con el concepto <span className="font-mono">Olanchito Guide — Destacado</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSwitchPlan("featured")}
                          disabled={switchingPlan}
                          className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
                        >
                          {switchingPlan ? "Procesando cobro..." : "Sí, confirmar y pagar"}
                        </button>
                        <button
                          onClick={() => setSubAction(null)}
                          disabled={switchingPlan}
                          className="rounded-xl px-4 py-2.5 text-xs font-semibold text-jungle-600 ring-1 ring-amber-300 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Manual subscriber — needs to pay again, show options */
                    <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 space-y-3">
                      <p className="text-xs font-bold text-jungle-950">¿Cómo quieres pagar el plan Destacado?</p>
                      <p className="text-xs text-jungle-600 leading-relaxed">
                        Tu plan actual fue activado por transferencia bancaria. Para subir a Destacado elige una opción:
                      </p>
                      <button
                        onClick={() => { setSubAction(null); handleDirectCheckout("featured"); }}
                        disabled={upgradeLoading === "featured"}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
                      >
                        <ArrowUpCircleIcon className="h-4 w-4" />
                        {upgradeLoading === "featured" ? "Redirigiendo..." : "Pagar con tarjeta — $10/mes"}
                      </button>
                      <a
                        href={`https://wa.me/50497952651?text=${encodeURIComponent("Hola, tengo el plan Premium y quiero subir al plan Destacado ($10/mes). Mi correo es " + (business.owner_email ?? ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 py-2.5 text-xs font-semibold text-[#25D366] ring-1 ring-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Pagar por transferencia bancaria
                      </a>
                      <button
                        onClick={() => setSubAction(null)}
                        className="w-full text-center text-xs text-jungle-500 hover:text-jungle-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  )
                ) : (
                  /* ── Default step ── */
                  <>
                    <ul className="mb-5 space-y-1.5">
                      {[
                        "Todo lo del plan Premium",
                        "Galería de hasta 15 fotos",
                        "Catálogo ilimitado de productos",
                        "Ofertas y promociones con precios",
                        "Anuncio destacado en tu página",
                        "Estadísticas de clics WA y teléfono",
                        "QR descargable para tu local",
                        "Aparece primero en los listados",
                        "Insignia de negocio destacado",
                      ].map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-jungle-700">
                          <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setSubAction("upgrade")}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-400 transition-colors"
                    >
                      <ArrowUpCircleIcon className="h-4 w-4" />
                      Cambiar a Destacado
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Cancel subscription */}
            {business.subscription_active && (
              <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <h3 className="text-sm font-bold text-jungle-950">Cancelar suscripción</h3>
                </div>

                {business.cancel_at_period_end ? (
                  /* ── Already scheduled for cancellation ── */
                  <div className="mt-3 rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-200">
                    <div className="flex items-start gap-2.5">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-orange-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-orange-900">Cancelación programada</p>
                        <p className="text-xs leading-relaxed text-orange-800">
                          Tu suscripción está activa hasta el final del período ya pagado. Al vencer, tu negocio pasará automáticamente al plan gratuito y perderás acceso a las funciones del portal.
                        </p>
                        <p className="text-[11px] text-orange-600 pt-0.5">
                          Si cambias de opinión, contáctanos por WhatsApp para reactivar tu plan.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : subAction === "cancel" ? (
                  /* ── Confirmation step ── */
                  <div className="mt-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
                    <p className="mb-3 text-xs font-semibold text-red-800">
                      ¿Estás seguro? Tu plan seguirá activo hasta el final del período ya pagado, luego pasará al plan gratuito y no podrás editar tu negocio.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={subLoading}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {subLoading ? "Cancelando..." : "Sí, cancelar"}
                      </button>
                      <button
                        onClick={() => setSubAction(null)}
                        className="rounded-xl px-4 py-2 text-xs font-semibold text-jungle-600 ring-1 ring-jungle-200 hover:bg-jungle-50"
                      >
                        No, mantener
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Default state ── */
                  <>
                    <p className="mb-4 mt-1 text-xs text-jungle-500">
                      Tu negocio seguirá visible en el directorio con el plan gratuito. Perderás acceso al portal de gestión y las fotos, catálogo y demás información se mantendrán pero no podrás editarlos.
                    </p>
                    <button
                      onClick={() => setSubAction("cancel")}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Cancelar suscripción
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reactivate if inactive */}
            {!business.subscription_active && (
              <div className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
                <p className="text-sm font-bold text-amber-900">Activa tu plan</p>
                <p className="mt-1 text-xs text-amber-700">Suscríbete para subir fotos, catálogo, estadísticas y más.</p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800"
                >
                  <ArrowUpCircleIcon className="h-4 w-4" />
                  Ver planes
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── UPGRADE MODAL ── */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowUpgradeModal(false); setUpgradeError(""); } }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-jungle-950">Elige tu plan</h2>
                <p className="mt-0.5 text-xs text-jungle-500">Serás redirigido a Stripe para completar el pago de forma segura.</p>
              </div>
              <button
                onClick={() => { setShowUpgradeModal(false); setUpgradeError(""); }}
                className="rounded-xl p-1.5 text-jungle-400 hover:bg-jungle-50 hover:text-jungle-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {upgradeError && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
                <p className="text-xs text-red-700">{upgradeError}</p>
              </div>
            )}

            {/* Plan cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Premium */}
              <div className="flex flex-col rounded-2xl bg-jungle-50 p-4 ring-1 ring-jungle-200">
                <p className="text-sm font-bold text-jungle-950">Premium</p>
                <p className="mt-0.5 text-2xl font-bold text-jungle-800">
                  $6<span className="text-xs font-semibold text-jungle-500">/mes</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 mb-4">
                  {[
                    "Galería de hasta 5 fotos",
                    "Catálogo de hasta 10 productos",
                    "Link de citas / reservas",
                    "Responder reseñas de clientes",
                    "Estadísticas de visitas",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-jungle-700">
                      <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-jungle-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleDirectCheckout("premium")}
                  disabled={!!upgradeLoading}
                  className="w-full rounded-xl bg-jungle-800 py-2.5 text-xs font-bold text-white hover:bg-jungle-700 disabled:opacity-50 transition-colors"
                >
                  {upgradeLoading === "premium" ? "Redirigiendo..." : "Contratar Premium"}
                </button>
              </div>

              {/* Destacado */}
              <div className="flex flex-col rounded-2xl bg-amber-50 p-4 ring-2 ring-amber-400">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-jungle-950">Destacado</p>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-amber-900">Más completo</span>
                </div>
                <p className="mt-0.5 text-2xl font-bold text-amber-700">
                  $10<span className="text-xs font-semibold text-amber-500">/mes</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 mb-4">
                  {[
                    "Todo lo del plan Premium",
                    "Galería de hasta 15 fotos",
                    "Catálogo ilimitado de productos",
                    "Ofertas y promociones con precios",
                    "Anuncio destacado en tu página",
                    "Estadísticas de clics WA y teléfono",
                    "QR descargable para tu local",
                    "Aparece primero en los listados",
                    "Insignia de negocio destacado",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-jungle-700">
                      <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleDirectCheckout("featured")}
                  disabled={!!upgradeLoading}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {upgradeLoading === "featured" ? "Redirigiendo..." : "Contratar Destacado"}
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-jungle-400">
              Pago seguro con Stripe · Cancela cuando quieras desde Configuración
            </p>

            <div className="mt-3 flex flex-col items-center gap-2 border-t border-jungle-100 pt-4">
              <p className="text-[11px] text-jungle-500">¿Prefieres pagar por transferencia bancaria?</p>
              <a
                href={`https://wa.me/50497952651?text=${encodeURIComponent("Hola, quiero activar un plan para mi negocio en el directorio de Olanchito y prefiero pagar por transferencia bancaria.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2 text-xs font-semibold text-[#25D366] ring-1 ring-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
        {icon}
      </div>
      <p className="text-2xl font-bold text-jungle-950">{value}</p>
      {sub && <p className="text-xs text-jungle-400">{sub}</p>}
      <p className="mt-0.5 text-xs font-semibold text-jungle-600">{label}</p>
    </div>
  );
}
