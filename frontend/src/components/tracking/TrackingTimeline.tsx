import React from 'react';

export interface TrackingEvent {
  title: string;
  date: string;
  description?: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface Props {
  events: TrackingEvent[];
}

const TrackingTimeline: React.FC<Props> = ({ events }) => {
  return (
    <div className="relative border-l border-slate-200 ml-3">
      {events.map((event, index) => (
        <div key={index} className="mb-6 ml-6">
          <span
            className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white ${
              event.isCompleted ? 'bg-primary' : event.isCurrent ? 'bg-accent' : 'bg-slate-200'
            }`}
          >
            {event.isCompleted && (
              <svg className="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5"/>
              </svg>
            )}
          </span>
          <h3 className={`flex items-center mb-1 text-base font-semibold ${event.isCompleted || event.isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
            {event.title}
            {event.isCurrent && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ml-3">
                Current
              </span>
            )}
          </h3>
          <time className="block mb-2 text-sm font-normal leading-none text-slate-400">
            {event.date}
          </time>
          {event.description && (
            <p className="mb-4 text-sm font-normal text-slate-500">
              {event.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrackingTimeline;
