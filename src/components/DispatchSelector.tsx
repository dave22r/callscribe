import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Ambulance, EmergencyCall } from '@/data/mockCalls';
import { calculateBestAmbulance } from '@/lib/dispatchAlgorithm';
import { Ambulance as AmbulanceIcon, MapPin, Users, Clock } from 'lucide-react';

interface DispatchSelectorProps {
  call: EmergencyCall | null;
  ambulances: Ambulance[];
  onDispatch: (ambulanceId: string) => void;
}

export default function DispatchSelector({ call, ambulances, onDispatch }: DispatchSelectorProps) {
  if (!call || call.status !== 'queued') {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">
          Select a queued call to see dispatch options
        </p>
      </div>
    );
  }

  const recommendation = calculateBestAmbulance(call, ambulances);
  const availableAmbulances = ambulances.filter((a) => a.status === 'available');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Dispatch Ambulance</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {call.callerName} • {call.urgency}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Recommended Ambulance */}
        {recommendation && (
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AmbulanceIcon className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Recommended</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                Best Match
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{recommendation.ambulance.unit}</span>
                <span className="text-xs text-muted-foreground">
                  Score: {recommendation.score.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{recommendation.ambulance.location}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{recommendation.ambulance.crew}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Distance: {recommendation.breakdown.distance} km</span>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => onDispatch(recommendation.ambulance.id)}
            >
              Dispatch {recommendation.ambulance.unit}
            </Button>
          </Card>
        )}

        {/* Other Available Ambulances */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Other Available ({availableAmbulances.length - (recommendation ? 1 : 0)})
          </h4>
          <div className="space-y-2">
            {availableAmbulances
              .filter((a) => a.id !== recommendation?.ambulance.id)
              .map((ambulance) => (
                <Card key={ambulance.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{ambulance.unit}</span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{ambulance.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{ambulance.crew}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onDispatch(ambulance.id)}
                  >
                    Dispatch
                  </Button>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
