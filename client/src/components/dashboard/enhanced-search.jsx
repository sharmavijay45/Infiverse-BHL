import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { searchUsers } from '@/lib/user-api';

export function EnhancedSearch({ onUserSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);



  // Search users function
  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSearchQuery('');
    setIsOpen(false);
    setSuggestions([]);
    onUserSelect(user);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate completion rate color
  const getCompletionRateColor = (rate) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="search-container relative max-w-lg flex-1 hidden md:flex group" ref={searchRef}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-cyber group-focus-within:text-primary group-focus-within:glow-primary z-10" />
      
      <Input
        type="search"
        placeholder="Search users, tasks, departments..."
        className="w-full pl-12 pr-4 py-3 neo-inset border-0 focus:neo-card focus:glow-primary transition-cyber text-sm font-medium"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => searchQuery && setIsOpen(true)}
      />
      
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
        <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center opacity-50 group-focus-within:opacity-100 transition-cyber">
          <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Search Suggestions */}
      {isOpen && (suggestions.length > 0 || loading) && (
        <Card
          ref={suggestionsRef}
          className="search-dropdown neo-card border-primary/20 shadow-2xl backdrop-blur-md max-h-96 overflow-y-auto animate-scale-in"
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-pulse-cyber text-muted-foreground">Searching users...</div>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Users ({suggestions.length})
              </div>
              {suggestions.map((user) => {
                if (!user || !user.name) return null;

                return (
                  <div
                    key={user._id || user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:neo-inset cursor-pointer transition-cyber group/item"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground group-hover/item:text-primary transition-cyber">
                        {user.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span className={getCompletionRateColor(user.completionRate)}>
                          {user.completionRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{user.activeTasks} active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(user.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                    <div className="text-xs text-muted-foreground">
                      {user.department?.name || user.department || 'No Department'}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
