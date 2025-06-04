
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  ShoeListing, 
  CreateShoeListingInput, 
  User,
  CreateUserInput,
  SearchShoesInput,
  ExchangeRequest,
  CreateExchangeRequestInput
} from '../../server/src/schema';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shoeListings, setShoeListings] = useState<ShoeListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ShoeListing[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ShoeListing | null>(null);

  // Form states
  const [userForm, setUserForm] = useState<CreateUserInput>({
    email: '',
    name: '',
    location: null
  });

  const [listingForm, setListingForm] = useState<CreateShoeListingInput>({
    user_id: 0,
    brand: '',
    model: '',
    size: 0,
    size_system: 'us',
    foot: 'left',
    condition: 'good',
    color: '',
    description: null,
    image_url: null
  });

  const [searchForm, setSearchForm] = useState<SearchShoesInput>({
    brand: undefined,
    size: undefined,
    size_system: undefined,
    foot: undefined,
    condition: undefined,
    color: undefined
  });

  const [exchangeMessage, setExchangeMessage] = useState('');

  // Load initial data
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadShoeListings = useCallback(async () => {
    try {
      const result = await trpc.getShoeListings.query();
      setShoeListings(result);
      setFilteredListings(result);
    } catch (error) {
      console.error('Failed to load shoe listings:', error);
    }
  }, []);

  const loadExchangeRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await trpc.getExchangeRequests.query({ userId: currentUser.id });
      setExchangeRequests(result);
    } catch (error) {
      console.error('Failed to load exchange requests:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
    loadShoeListings();
  }, [loadUsers, loadShoeListings]);

  useEffect(() => {
    loadExchangeRequests();
  }, [loadExchangeRequests]);

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(userForm);
      setUsers((prev: User[]) => [...prev, newUser]);
      setCurrentUser(newUser);
      setUserForm({ email: '', name: '', location: null });
      setShowCreateUser(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create shoe listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const listingData = { ...listingForm, user_id: currentUser.id };
      const newListing = await trpc.createShoeListing.mutate(listingData);
      setShoeListings((prev: ShoeListing[]) => [...prev, newListing]);
      setFilteredListings((prev: ShoeListing[]) => [...prev, newListing]);
      setListingForm({
        user_id: 0,
        brand: '',
        model: '',
        size: 0,
        size_system: 'us',
        foot: 'left',
        condition: 'good',
        color: '',
        description: null,
        image_url: null
      });
    } catch (error) {
      console.error('Failed to create listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search shoes
  const handleSearch = async () => {
    try {
      const cleanedSearch = Object.fromEntries(
        Object.entries(searchForm).filter(([, value]) => value !== undefined && value !== '')
      );
      const result = await trpc.searchShoes.query(cleanedSearch);
      setFilteredListings(result);
    } catch (error) {
      console.error('Failed to search shoes:', error);
    }
  };

  // Create exchange request
  const handleCreateExchange = async (targetListingId: number) => {
    if (!currentUser) return;
    
    // Find user's available listing
    const userListings = shoeListings.filter(
      (listing: ShoeListing) => listing.user_id === currentUser.id && listing.is_available
    );
    
    if (userListings.length === 0) {
      alert('You need to have an available shoe listing to make an exchange request!');
      return;
    }

    setIsLoading(true);
    try {
      const exchangeData: CreateExchangeRequestInput = {
        requester_listing_id: userListings[0].id,
        target_listing_id: targetListingId,
        message: exchangeMessage || null
      };
      
      await trpc.createExchangeRequest.mutate(exchangeData);
      setExchangeMessage('');
      setShowExchangeDialog(false);
      setSelectedListing(null);
      loadExchangeRequests();
    } catch (error) {
      console.error('Failed to create exchange request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like_new': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFootEmoji = (foot: string) => {
    return foot === 'left' ? '🦶' : '🦵';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-purple-800">
              👟 SoleMatch 
            </CardTitle>
            <p className="text-gray-600">Shoe Exchange for Everyone</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-4">
                Welcome to SoleMatch! Connect with others to find your perfect shoe match.
              </p>
            </div>
            
            {users.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Select existing user:</p>
                <Select onValueChange={(value: string) => {
                  const user = users.find((u: User) => u.id === parseInt(value));
                  if (user) setCurrentUser(user);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">or</p>
              <Button 
                onClick={() => setShowCreateUser(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                ✨ Create New Account
              </Button>
            </div>

            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <Input
                    placeholder="Your name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={userForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Location (optional)"
                    value={userForm.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({
                        ...prev,
                        location: e.target.value || null
                      }))
                    }
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating...' : '🚀 Join SoleMatch'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">👟 SoleMatch</h1>
            <p className="text-gray-600">Welcome back, {currentUser.name}!</p>
          </div>
          <Button
            onClick={() => setCurrentUser(null)}
            variant="outline"
            className="text-purple-600 border-purple-300"
          >
            Switch User
          </Button>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">🔍 Browse Shoes</TabsTrigger>
            <TabsTrigger value="my-listings">👟 My Listings</TabsTrigger>
            <TabsTrigger value="exchanges">🤝 Exchanges</TabsTrigger>
            <TabsTrigger value="add-shoe">➕ Add Shoe</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Find Your Perfect Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                  <Input
                    placeholder="Brand (e.g., Nike)"
                    value={searchForm.brand || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchForm((prev: SearchShoesInput) => ({ ...prev, brand: e.target.value || undefined }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Size"
                    value={searchForm.size || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchForm((prev: SearchShoesInput) => ({ 
                        ...prev, 
                        size: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))
                    }
                  />
                  <Select onValueChange={(value: string) => 
                    setSearchForm((prev: SearchShoesInput) => ({ 
                      ...prev, 
                      foot: value === 'all' ? undefined : value as 'left' | 'right'
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Foot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="left">🦶 Left</SelectItem>
                      <SelectItem value="right">🦵 Right</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value: string) => 
                    setSearchForm((prev: SearchShoesInput) => ({ 
                      ...prev, 
                      condition: value === 'all' ? undefined : value as 'new' | 'like_new' | 'good' | 'fair' | 'poor'
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
                    Search
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    setSearchForm({});
                    setFilteredListings(shoeListings);
                  }}
                  variant="outline"
                  className="mb-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings
                .filter((listing: ShoeListing) => listing.user_id !== currentUser.id && listing.is_available)
                .map((listing: ShoeListing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {listing.brand} {listing.model}
                        </CardTitle>
                        <p className="text-gray-600">
                          Size {listing.size} {listing.size_system.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {getFootEmoji(listing.foot)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getConditionColor(listing.condition)}>
                        {listing.condition.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {listing.foot} foot
                      </Badge>
                      <Badge variant="secondary">
                        {listing.color}
                      </Badge>
                    </div>
                    
                    {listing.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {listing.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      Listed {listing.created_at.toLocaleDateString()}
                    </p>
                    
                    <Button 
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowExchangeDialog(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      🤝 Request Exchange
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredListings.filter((listing: ShoeListing) => 
              listing.user_id !== currentUser.id && listing.is_available
            ).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    No shoes found matching your criteria. Try adjusting your filters!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-listings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shoeListings
                .filter((listing: ShoeListing) => listing.user_id === currentUser.id)
                .map((listing: ShoeListing) => (
                <Card key={listing.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {listing.brand} {listing.model}
                        </CardTitle>
                        <p className="text-gray-600">
                          Size {listing.size} {listing.size_system.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {getFootEmoji(listing.foot)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getConditionColor(listing.condition)}>
                        {listing.condition.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {listing.foot} foot
                      </Badge>
                      <Badge variant="secondary">
                        {listing.color}
                      </Badge>
                      <Badge variant={listing.is_available ? "default" : "destructive"}>
                        {listing.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    
                    {listing.description && (
                      <p className="text-sm text-gray-600">
                        {listing.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      Listed {listing.created_at.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {shoeListings.filter((listing: ShoeListing) => listing.user_id === currentUser.id).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    You haven't listed any shoes yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exchanges">
            <div className="space-y-4">
              {exchangeRequests.map((request: ExchangeRequest) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Exchange Request #{request.id}</p>
                        <p className="text-sm text-gray-600">
                          Status: <Badge variant={
                            request.status === 'pending' ? 'default' :
                            request.status === 'accepted' ? 'secondary' :
                            request.status === 'completed' ? 'default' : 'destructive'
                          }>
                            {request.status}
                          </Badge>
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-2">
                            Message: {request.message}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {request.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {exchangeRequests.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">
                      No exchange requests yet. Start browsing shoes to make your first exchange!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add-shoe">
            <Card>
              <CardHeader>
                <CardTitle>➕ List Your Shoe</CardTitle>
                <p className="text-gray-600">
                  Share your single shoe with the community to find a perfect match!
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateListing} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Brand (e.g., Nike, Adidas)"
                      value={listingForm.brand}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setListingForm((prev: CreateShoeListingInput) => ({ ...prev, brand: e.target.value }))
                      }
                      required
                    />
                    <Input
                      placeholder="Model (e.g., Air Max 90)"
                      value={listingForm.model}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setListingForm((prev: CreateShoeListingInput) => ({ ...prev, model: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      type="number"
                      placeholder="Size"
                      value={listingForm.size || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setListingForm((prev: CreateShoeListingInput) => ({ 
                          ...prev, 
                          size: parseFloat(e.target.value) || 0 
                        }))
                      }
                      step="0.5"
                      min="1"
                      required
                    />
                    <Select onValueChange={(value: string) => 
                      setListingForm((prev: CreateShoeListingInput) => ({ 
                        ...prev, 
                        size_system: value as 'us' | 'eu' | 'uk'
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Size System" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">US</SelectItem>
                        <SelectItem value="eu">EU</SelectItem>
                        <SelectItem value="uk">UK</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value: string) => 
                      setListingForm((prev: CreateShoeListingInput) => ({ 
                        ...prev, 
                        foot: value as 'left' | 'right'
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Which foot?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">🦶 Left Foot</SelectItem>
                        <SelectItem value="right">🦵 Right Foot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={(value: string) => 
                      setListingForm((prev: CreateShoeListingInput) => ({ 
                        ...prev, 
                        condition: value as 'new' | 'like_new' | 'good' | 'fair' | 'poor'
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Color"
                      value={listingForm.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setListingForm((prev: CreateShoeListingInput) => ({ ...prev, color: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <Textarea
                    placeholder="Description (optional) - Any additional details about the shoe..."
                    value={listingForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setListingForm((prev: CreateShoeListingInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={3}
                  />
                  
                  <Input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={listingForm.image_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setListingForm((prev: CreateShoeListingInput) => ({
                        ...prev,
                        image_url: e.target.value || null
                      }))
                    }
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? 'Listing...' : '🚀 List My Shoe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Exchange Request Dialog */}
        <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Exchange</DialogTitle>
            </DialogHeader>
            {selectedListing && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium">You want to exchange for:</h3>
                  <p className="text-sm text-gray-600">
                    {selectedListing.brand} {selectedListing.model} - 
                    Size {selectedListing.size} {selectedListing.size_system.toUpperCase()} - 
                    {selectedListing.foot} foot - {selectedListing.color}
                  </p>
                </div>
                
                <Textarea
                  placeholder="Add a message to your exchange request (optional)..."
                  value={exchangeMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setExchangeMessage(e.target.value)
                  }
                  rows={3}
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCreateExchange(selectedListing.id)}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Sending...' : '🤝 Send Request'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowExchangeDialog(false);
                      setSelectedListing(null);
                      setExchangeMessage('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
