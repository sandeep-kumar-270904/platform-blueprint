import React from 'react';
import { useRoommates } from '@/hooks/useRoommates';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Check, X, Clock } from 'lucide-react';

export const RoommateConnections = () => {
  const { getConnections, updateConnection } = useRoommates();
  const { user } = useAuth();

  if (getConnections.isLoading) return <div className="text-center py-8">Loading connections...</div>;

  const connections = getConnections.data || [];
  
  if (connections.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
        <p className="text-muted-foreground">Start connecting with potential roommates in the Find Roommates tab.</p>
      </div>
    );
  }

  const handleUpdate = (id: string, status: 'Accepted' | 'Declined') => {
    updateConnection.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Roommate Connections</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map(conn => {
          const isSender = conn.requester._id === user?.id;
          const otherPerson = isSender ? conn.recipient : conn.requester;
          
          let statusBadge;
          if (conn.status === 'Accepted') statusBadge = <Badge className="bg-green-500">Accepted</Badge>;
          else if (conn.status === 'Declined') statusBadge = <Badge variant="destructive">Declined</Badge>;
          else statusBadge = <Badge variant="secondary"><Clock className="w-3 h-3 mr-1 inline"/> Pending</Badge>;

          return (
            <Card key={conn._id} className="relative overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isSender ? 'Outbound Request' : 'Inbound Request'}
                  </span>
                  {statusBadge}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  {otherPerson.profilePicture ? (
                    <img src={otherPerson.profilePicture} alt="User" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {otherPerson.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{otherPerson.name}</h3>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {conn.status === 'Accepted' && otherPerson.email ? (
                  <div className="bg-green-50 text-green-800 p-3 rounded-md flex items-center gap-2 text-sm border border-green-200">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${otherPerson.email}`} className="font-medium hover:underline">{otherPerson.email}</a>
                  </div>
                ) : conn.status === 'Accepted' ? (
                  <div className="bg-muted p-3 rounded-md text-sm">Contact info unavailable</div>
                ) : (
                  <div className="text-sm text-muted-foreground mb-4">
                    Contact info hidden until request is accepted.
                  </div>
                )}

                {!isSender && conn.status === 'Pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={updateConnection.isPending}
                      onClick={() => handleUpdate(conn._id, 'Accepted')}
                    >
                      <Check className="w-4 h-4 mr-2" /> Accept
                    </Button>
                    <Button 
                      className="flex-1"
                      variant="outline"
                      disabled={updateConnection.isPending}
                      onClick={() => handleUpdate(conn._id, 'Declined')}
                    >
                      <X className="w-4 h-4 mr-2" /> Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
