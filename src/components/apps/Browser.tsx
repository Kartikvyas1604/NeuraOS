
import { useState } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCcw, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
}

export const Browser = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: '1',
      url: 'https://lovable.dev',
      title: 'Lovable - AI Web Development',
      isActive: true,
    },
  ]);
  const [addressBar, setAddressBar] = useState('https://lovable.dev');

  const activeTab = tabs.find(tab => tab.isActive);

  const addNewTab = () => {
    const newTab: BrowserTab = {
      id: Date.now().toString(),
      url: 'about:blank',
      title: 'New Tab',
      isActive: true,
    };
    
    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, isActive: false })),
      newTab
    ]);
    setAddressBar('');
  };

  const switchTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setAddressBar(tab.url);
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close last tab
    
    const closingActiveTab = tabs.find(tab => tab.id === tabId)?.isActive;
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (closingActiveTab && newTabs.length > 0) {
        newTabs[0].isActive = true;
        setAddressBar(newTabs[0].url);
      }
      return newTabs;
    });
  };

  const navigateToUrl = () => {
    if (!addressBar) return;
    
    let url = addressBar;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setTabs(prev => prev.map(tab => 
      tab.isActive 
        ? { ...tab, url, title: new URL(url).hostname }
        : tab
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigateToUrl();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Tab Bar */}
      <div className="border-b border-slate-700 px-4 pt-2">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg cursor-pointer max-w-48 ${
                tab.isActive 
                  ? 'bg-slate-800 border-t border-l border-r border-slate-600' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              onClick={() => switchTab(tab.id)}
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-1 hover:bg-slate-600 rounded"
              >
                ×
              </button>
            </div>
          ))}
          <Button
            onClick={addNewTab}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-b border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Home className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1">
            <Input
              value={addressBar}
              onChange={(e) => setAddressBar(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter URL or search..."
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1">
        {activeTab && activeTab.url !== 'about:blank' ? (
          <iframe
            src={activeTab.url}
            className="w-full h-full border-none bg-white"
            title={activeTab.title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-links"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Globe className="h-16 w-16 mx-auto mb-4 text-slate-600" />
              <h2 className="text-xl font-semibold mb-2">New Tab</h2>
              <p className="text-slate-400 mb-6">Enter a URL to get started</p>
              <div className="space-y-2">
                <h3 className="font-medium">Quick Links:</h3>
                <div className="space-x-4">
                  {[
                    { name: 'Lovable', url: 'https://lovable.dev' },
                    { name: 'GitHub', url: 'https://github.com' },
                    { name: 'MDN', url: 'https://developer.mozilla.org' },
                  ].map((link) => (
                    <button
                      key={link.name}
                      onClick={() => {
                        setAddressBar(link.url);
                        navigateToUrl();
                      }}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
