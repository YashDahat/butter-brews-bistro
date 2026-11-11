// Butter Brews domain: types + API calls (all through the foundation apiClient: JWT + error toasts are automatic).
import apiClient from '@/api/client';
import type { BulkUploadResult } from '@/types/bulkUpload';

export type Diet = 'VEG' | 'EGG' | 'NON_VEG' | 'VEGAN';
export type BakeStatus = 'IN_THE_OVEN' | 'OUT_NOW' | 'SOLD_OUT';
export type IdeaStatus = 'NEW' | 'PLANNED' | 'DONE' | 'NOT_NOW';
export type IdeaTopic = 'BAGEL' | 'MENU' | 'COFFEE' | 'BAKEHOUSE' | 'SPACE' | 'SERVICE';

export interface DishNoteDto { id: number; productId: number; productName: string | null; diet: Diet; signature: boolean;
  newUntil: string | null; isNew: boolean; pairing: string | null }
export interface UpsertDishNoteRequest { productId: number; diet: Diet; signature: boolean; newUntil: string | null; pairing: string | null }

export interface BakeDropDto { id: number; name: string; productId: number | null; productSlug: string | null; price: number | null;
  bakeDate: string; outAt: string | null; status: BakeStatus; note: string | null; sortOrder: number }
export interface UpsertBakeDropRequest { name: string; productId: number | null; bakeDate: string | null; outAt: string | null;
  status: BakeStatus; note: string | null; sortOrder: number | null }
export interface BakeBoardDto { date: string; today: boolean; drops: BakeDropDto[] }

export interface SeatingAreaDto { id: number; name: string; slug: string; description: string | null; seatsPerSlot: number;
  maxParty: number; firstSlot: string; lastSlot: string; slotMinutes: number; outdoor: boolean; petFriendly: boolean;
  active: boolean; sortOrder: number }
export type UpsertSeatingAreaRequest = Omit<SeatingAreaDto, 'id'>;
export interface SlotDto { key: string; time: string; seatsLeft: number; bookable: boolean }
export interface AreaAvailabilityDto { areaId: number; name: string; maxParty: number; outdoor: boolean; petFriendly: boolean; slots: SlotDto[] }
export interface CreateReservationRequest { areaId: number; date: string; time: string; guests: number; occasion?: string | null;
  withPet?: boolean; note?: string | null }
export interface ReservationView { orderId: number; orderNumber: string | null; areaId: number; areaName: string; slotKey: string;
  guests: number; stageCode: string | null; cancellable: boolean; occasion: string | null; withPet: boolean; note: string | null;
  createdAt: string }
export interface AdminReservationRow { id: number; orderId: number; orderNumber: string | null; stageCode: string | null;
  areaName: string; slotKey: string; guests: number; occasion: string | null; withPet: boolean; note: string | null; createdAt: string }

export interface IdeaDto { id: number; authorName: string | null; topic: IdeaTopic; title: string; details: string | null;
  status: IdeaStatus; teamReply: string | null; votes: number; mine: boolean; voted: boolean; createdAt: string }
export interface CreateIdeaRequest { topic: IdeaTopic; title: string; details?: string | null }
export interface IdeaSubmitResult { idea: IdeaDto; coinsEarned: number; message: string }

export interface StoryChapterDto { id: number; ordinal: number; step: string; marker: string | null; title: string; body: string; active: boolean }
export type UpsertStoryChapterRequest = Omit<StoryChapterDto, 'id'>;

export interface EarnRuleDto { eventType: string; title: string; detail: string; coins: number; perDayCap: number | null; onceOnly: boolean }
export interface JourneyStepDto { key: string; title: string; hint: string; href: string; done: boolean }
export interface JourneyDto { steps: JourneyStepDto[]; done: number; total: number }

const upload = (url: string, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return apiClient.post<BulkUploadResult>(url, fd).then(r => r.data);
};

export const bbService = {
  dishNotes: () => apiClient.get<DishNoteDto[]>('/api/v1/bb/dish-notes').then(r => r.data),
  bakeBoard: () => apiClient.get<BakeBoardDto>('/api/v1/bb/bake-board').then(r => r.data),
  seating: () => apiClient.get<SeatingAreaDto[]>('/api/v1/bb/seating').then(r => r.data),
  availability: (date: string) =>
    apiClient.get<AreaAvailabilityDto[]>('/api/v1/bb/seating/availability', { params: { date } }).then(r => r.data),
  story: () => apiClient.get<StoryChapterDto[]>('/api/v1/bb/story').then(r => r.data),
  waysToEarn: () => apiClient.get<EarnRuleDto[]>('/api/v1/bb/ways-to-earn').then(r => r.data),
  ideas: () => apiClient.get<IdeaDto[]>('/api/v1/bb/ideas').then(r => r.data),
  myIdeas: () => apiClient.get<IdeaDto[]>('/api/v1/bb/ideas/mine').then(r => r.data),
  submitIdea: (req: CreateIdeaRequest) => apiClient.post<IdeaSubmitResult>('/api/v1/bb/ideas', req).then(r => r.data),
  vote: (id: number) => apiClient.post<IdeaDto>(`/api/v1/bb/ideas/${id}/vote`).then(r => r.data),
  book: (req: CreateReservationRequest) => apiClient.post<ReservationView>('/api/v1/bb/reservations', req).then(r => r.data),
  myReservations: () => apiClient.get<ReservationView[]>('/api/v1/bb/reservations/mine').then(r => r.data),
  favourites: () => apiClient.get<number[]>('/api/v1/bb/favourites').then(r => r.data),
  addFavourite: (productId: number) => apiClient.put<number[]>(`/api/v1/bb/favourites/${productId}`).then(r => r.data),
  removeFavourite: (productId: number) => apiClient.delete<number[]>(`/api/v1/bb/favourites/${productId}`).then(r => r.data),
  journey: () => apiClient.get<JourneyDto>('/api/v1/bb/journey').then(r => r.data),
  markJourney: (mark: string) => apiClient.post<JourneyDto>('/api/v1/bb/journey/marks', { mark }).then(r => r.data),

  admin: {
    dishNotes: () => apiClient.get<DishNoteDto[]>('/api/v1/admin/bb/dish-notes').then(r => r.data),
    upsertDishNote: (req: UpsertDishNoteRequest) => apiClient.put<DishNoteDto>('/api/v1/admin/bb/dish-notes', req).then(r => r.data),
    deleteDishNote: (id: number) => apiClient.delete(`/api/v1/admin/bb/dish-notes/${id}`),
    uploadDishNotes: (f: File) => upload('/api/v1/admin/bb/dish-notes/bulk-upload', f),

    bakes: () => apiClient.get<BakeDropDto[]>('/api/v1/admin/bb/bake-drops').then(r => r.data),
    createBake: (req: UpsertBakeDropRequest) => apiClient.post<BakeDropDto>('/api/v1/admin/bb/bake-drops', req).then(r => r.data),
    updateBake: (id: number, req: UpsertBakeDropRequest) => apiClient.put<BakeDropDto>(`/api/v1/admin/bb/bake-drops/${id}`, req).then(r => r.data),
    deleteBake: (id: number) => apiClient.delete(`/api/v1/admin/bb/bake-drops/${id}`),
    uploadBakes: (f: File) => upload('/api/v1/admin/bb/bake-drops/bulk-upload', f),

    seating: () => apiClient.get<SeatingAreaDto[]>('/api/v1/admin/bb/seating').then(r => r.data),
    createArea: (req: UpsertSeatingAreaRequest) => apiClient.post<SeatingAreaDto>('/api/v1/admin/bb/seating', req).then(r => r.data),
    updateArea: (id: number, req: UpsertSeatingAreaRequest) => apiClient.put<SeatingAreaDto>(`/api/v1/admin/bb/seating/${id}`, req).then(r => r.data),
    deleteArea: (id: number) => apiClient.delete(`/api/v1/admin/bb/seating/${id}`),
    uploadSeating: (f: File) => upload('/api/v1/admin/bb/seating/bulk-upload', f),

    story: () => apiClient.get<StoryChapterDto[]>('/api/v1/admin/bb/story').then(r => r.data),
    createChapter: (req: UpsertStoryChapterRequest) => apiClient.post<StoryChapterDto>('/api/v1/admin/bb/story', req).then(r => r.data),
    updateChapter: (id: number, req: UpsertStoryChapterRequest) => apiClient.put<StoryChapterDto>(`/api/v1/admin/bb/story/${id}`, req).then(r => r.data),
    deleteChapter: (id: number) => apiClient.delete(`/api/v1/admin/bb/story/${id}`),
    uploadStory: (f: File) => upload('/api/v1/admin/bb/story/bulk-upload', f),

    ideas: () => apiClient.get<IdeaDto[]>('/api/v1/admin/bb/ideas').then(r => r.data),
    updateIdea: (id: number, req: { status: IdeaStatus; teamReply: string | null }) =>
      apiClient.put<IdeaDto>(`/api/v1/admin/bb/ideas/${id}`, req).then(r => r.data),
    deleteIdea: (id: number) => apiClient.delete(`/api/v1/admin/bb/ideas/${id}`),
    uploadIdeas: (f: File) => upload('/api/v1/admin/bb/ideas/bulk-upload', f),

    reservations: () => apiClient.get<AdminReservationRow[]>('/api/v1/admin/bb/reservations').then(r => r.data),
  },
};

// helpers
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n: number | null | undefined) => (n == null ? '' : inr.format(n));

export const BRAND = {
  name: 'Butter Brews',
  phone: '+91 96074 04669',
  phoneHref: 'tel:+919607404669',
  whatsapp: 'https://wa.me/919607404669',
  address: 'Shop 11 & 12, Rajas Garden, opp. Hanuman Mandir, Model Colony, Shivajinagar, Pune 411016',
  hours: 'Open daily, 9 am to 10:30 pm',
  maps: 'https://www.google.com/maps/search/?api=1&query=Butter+Brews+Bistro+Model+Colony+Pune',
  mapEmbed: 'https://maps.google.com/maps?q=18.5299036,73.8324434&z=16&output=embed',
};

export const DIET_LABEL: Record<Diet, string> = { VEG: 'Veg', EGG: 'Contains egg', NON_VEG: 'Non-veg', VEGAN: 'Vegan' };
export const TOPIC_LABEL: Record<IdeaTopic, string> = {
  BAGEL: 'A bagel', MENU: 'The menu', COFFEE: 'Coffee', BAKEHOUSE: 'Bakehouse', SPACE: 'The space', SERVICE: 'Service',
};
export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = { NEW: 'In the Lab', PLANNED: 'Planned', DONE: 'On the menu', NOT_NOW: 'Not now' };
export const BAKE_STATUS_LABEL: Record<BakeStatus, string> = { IN_THE_OVEN: 'In the oven', OUT_NOW: 'Out now', SOLD_OUT: 'All gone' };

/** Friendly stage names for order / booking progress across the three workflows. */
export const STAGE_LABEL: Record<string, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', IN_THE_KITCHEN: 'In the kitchen', READY: 'Packed & ready', HANDED_OVER: 'Handed over',
  BAKING: 'In the oven', FINISHING: 'Finishing & boxing', READY_FOR_PICKUP: 'Ready for pickup', COLLECTED: 'Collected',
  REQUESTED: 'Requested', SEATED: 'Seated', COMPLETED: 'Visit complete', CANCELLED: 'Cancelled', DELIVERED: 'Delivered',
};
export const WORKFLOW_STEPS: Record<string, string[]> = {
  'bb-kitchen': ['PLACED', 'CONFIRMED', 'IN_THE_KITCHEN', 'READY', 'HANDED_OVER'],
  'bb-bakehouse': ['PLACED', 'CONFIRMED', 'BAKING', 'FINISHING', 'READY_FOR_PICKUP', 'COLLECTED'],
  'bb-table': ['REQUESTED', 'CONFIRMED', 'SEATED', 'COMPLETED'],
};

export const slotLabel = (slotKey: string) => {
  const d = new Date(slotKey + ':00');
  if (Number.isNaN(d.getTime())) return slotKey;
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
