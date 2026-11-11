import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BakeBoardTab from './BakeBoardTab';
import DishNotesTab from './DishNotesTab';
import SeatingTab from './SeatingTab';
import StoryTab from './StoryTab';
import IdeasTab from './IdeasTab';
import ReservationsTab from './ReservationsTab';

export default function AdminButterBrewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bistro</h1>
        <p className="text-sm text-muted-foreground">Today's bakes, menu marks, seating, bookings, the story and the Schmear Lab.</p>
      </div>
      <Tabs defaultValue="bakes">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="bakes">Bake board</TabsTrigger>
          <TabsTrigger value="menu">Menu notes</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="seating">Seating</TabsTrigger>
          <TabsTrigger value="ideas">Schmear Lab</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
        </TabsList>
        <TabsContent value="bakes"><BakeBoardTab /></TabsContent>
        <TabsContent value="menu"><DishNotesTab /></TabsContent>
        <TabsContent value="bookings"><ReservationsTab /></TabsContent>
        <TabsContent value="seating"><SeatingTab /></TabsContent>
        <TabsContent value="ideas"><IdeasTab /></TabsContent>
        <TabsContent value="story"><StoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
