import { memo } from 'react';
import ActionCenter from './ActionCenter';
import ConversationTimeline from './ConversationTimeline';
import ShoppingProfile from './ShoppingProfile';

function Sidebar({
  actionProps,
  journeyStage,
  memory,
  onRemoveMemoryKey,
  sessionData,
  timeline,
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-36 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto xl:pr-1 xl:scrollbar-hide">
      <ShoppingProfile
        journeyStage={journeyStage}
        memory={memory}
        onRemoveKey={onRemoveMemoryKey}
        sessionData={sessionData}
      />
      <ActionCenter {...actionProps} />
      <ConversationTimeline events={timeline} />
    </aside>
  );
}

export default memo(Sidebar);
