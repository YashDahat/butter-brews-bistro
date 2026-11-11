import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bbService } from '@/lib/bb';
import type { CreateIdeaRequest, CreateReservationRequest } from '@/lib/bb';
import { useAuth } from '@/context/AuthContext';
import { withToast } from '@/lib/apiToast';

export const useDishNotes = () => useQuery({ queryKey: ['bb', 'dish-notes'], queryFn: bbService.dishNotes, staleTime: 60_000 });
export const useBakeBoard = () => useQuery({ queryKey: ['bb', 'bake-board'], queryFn: bbService.bakeBoard, staleTime: 60_000 });
export const useStory = () => useQuery({ queryKey: ['bb', 'story'], queryFn: bbService.story, staleTime: 300_000 });
export const useWaysToEarn = () => useQuery({ queryKey: ['bb', 'ways-to-earn'], queryFn: bbService.waysToEarn, staleTime: 300_000 });
export const useSeating = () => useQuery({ queryKey: ['bb', 'seating'], queryFn: bbService.seating, staleTime: 300_000 });
export const useAvailability = (date: string) =>
  useQuery({ queryKey: ['bb', 'availability', date], queryFn: () => bbService.availability(date), enabled: !!date });
export const useIdeas = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['bb', 'ideas', isAuthenticated], queryFn: bbService.ideas });
};

export function useMyReservations() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['bb', 'my-reservations'], queryFn: bbService.myReservations, enabled: isAuthenticated });
}
export function useMyIdeas() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['bb', 'my-ideas'], queryFn: bbService.myIdeas, enabled: isAuthenticated });
}
export function useJourney() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['bb', 'journey'], queryFn: bbService.journey, enabled: isAuthenticated });
}
export function useFavourites() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['bb', 'favourites'], queryFn: bbService.favourites, enabled: isAuthenticated });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, on }: { productId: number; on: boolean }) =>
      on ? withToast(bbService.addFavourite(productId), 'Saved to your favourites')
         : withToast(bbService.removeFavourite(productId), 'Removed from favourites'),
    onSuccess: (ids) => {
      qc.setQueryData(['bb', 'favourites'], ids);
      qc.invalidateQueries({ queryKey: ['bb', 'journey'] });
    },
  });
}

export function useBookTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReservationRequest) => withToast(bbService.book(req), 'Table held. See you soon!'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bb', 'my-reservations'] });
      qc.invalidateQueries({ queryKey: ['bb', 'availability'] });
      qc.invalidateQueries({ queryKey: ['bb', 'journey'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSubmitIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateIdeaRequest) => bbService.submitIdea(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bb', 'ideas'] });
      qc.invalidateQueries({ queryKey: ['bb', 'my-ideas'] });
      qc.invalidateQueries({ queryKey: ['bb', 'journey'] });
      qc.invalidateQueries({ queryKey: ['loyalty-me'] });
      qc.invalidateQueries({ queryKey: ['loyalty-coins'] });
    },
  });
}

export function useVoteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withToast(bbService.vote(id), '+1 added'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bb', 'ideas'] }),
  });
}

export function useMarkJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mark: string) => bbService.markJourney(mark),
    onSuccess: (j) => qc.setQueryData(['bb', 'journey'], j),
  });
}
