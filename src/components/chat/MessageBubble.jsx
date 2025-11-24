import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    const statusConfig = {
        pending: { icon: Clock, color: '#9ea7b5', text: 'Pending' },
        running: { icon: Loader2, color: '#54b0e7', text: 'Searching...', spin: true },
        in_progress: { icon: Loader2, color: '#54b0e7', text: 'Searching...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: '#f66c25', text: 'Failed' } : 
            { icon: CheckCircle2, color: '#4acbbf', text: 'Complete' },
        success: { icon: CheckCircle2, color: '#4acbbf', text: 'Complete' },
        failed: { icon: AlertCircle, color: '#f66c25', text: 'Failed' },
        error: { icon: AlertCircle, color: '#f66c25', text: 'Failed' }
    }[status] || { icon: Zap, color: '#54b0e7', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                style={{
                    background: expanded ? 'rgba(84, 176, 231, 0.2)' : 'rgba(10, 25, 41, 0.5)',
                    borderColor: expanded ? '#54b0e7' : '#5e6a78'
                }}
            >
                <Icon className={cn("h-3 w-3", statusConfig.spin && "animate-spin")} style={{ color: statusConfig.color }} />
                <span style={{ color: '#d7dde5' }}>{formattedName}</span>
                {statusConfig.text && (
                    <span style={{ color: isError ? '#c0392b' : '#9ea7b5' }}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 transition-transform ml-auto", expanded && "rotate-90")} style={{ color: '#5e6a78' }} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-gray-700 space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Parameters:</div>
                            <pre className="bg-gray-900 rounded-md p-2 text-xs text-gray-400 whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Result:</div>
                            <pre className="bg-gray-900 rounded-md p-2 text-xs text-gray-400 whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ResultsSection = ({ toolCall }) => {
    const results = toolCall?.results;
    let parsedResults = null;
    let resultType = 'unknown';
    
    try {
        parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
        
        if (Array.isArray(parsedResults) && parsedResults.length > 0 && parsedResults[0].username) {
            resultType = 'database';
        } else if (typeof parsedResults === 'object' && (parsedResults.query || parsedResults.results)) {
            resultType = 'web';
        }
    } catch {
        parsedResults = results;
    }
    
    if (!parsedResults || (Array.isArray(parsedResults) && parsedResults.length === 0)) {
        return null;
    }
    
    return (
        <div className="mt-3 rounded-xl overflow-hidden" style={{ background: '#0a1929', border: '2px solid #4acbbf' }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(74, 203, 191, 0.1)', borderBottom: '1px solid #4acbbf' }}>
                <div className="h-2 w-2 rounded-full" style={{ background: resultType === 'database' ? '#4acbbf' : '#54b0e7' }} />
                <span className="text-xs font-semibold" style={{ color: '#f8d417' }}>
                    {resultType === 'database' ? '📊 Database Results' : '🌐 Web Search Results'}
                </span>
            </div>
            <div className="p-3 text-xs" style={{ color: '#9ea7b5' }}>
                {resultType === 'database' && Array.isArray(parsedResults) && (
                    <div className="space-y-2">
                        {parsedResults.slice(0, 5).map((lead, idx) => (
                            <div key={idx} className="p-2 rounded-lg" style={{ background: '#071a2c' }}>
                                <div className="font-semibold" style={{ color: '#ffffff' }}>@{lead.username}</div>
                                {lead.name && <div style={{ color: '#d7dde5' }}>{lead.name}</div>}
                                {lead.bio && <div className="text-xs mt-1" style={{ color: '#9ea7b5' }}>{lead.bio.substring(0, 100)}...</div>}
                            </div>
                        ))}
                        {parsedResults.length > 5 && (
                            <div className="text-center pt-2" style={{ color: '#5e6a78' }}>
                                +{parsedResults.length - 5} more results
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    
    const hasResults = message.tool_calls?.some(tc => {
        try {
            const results = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
            return results && (Array.isArray(results) ? results.length > 0 : true);
        } catch {
            return false;
        }
    });
    
    return (
        <div className={cn("flex gap-2 sm:gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691ccbe8057765b3fc1fdb65/dd282f7ea_LL-Logo1024x1024.png" 
                  alt="Glytch"
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg object-cover mt-0.5 shadow-lg flex-shrink-0"
                />
            )}
            <div className={cn("max-w-[85%] w-full", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className="rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5" style={{
                        background: isUser ? 'linear-gradient(135deg, #54b0e7 0%, #4acbbf 100%)' : 'rgba(10, 25, 41, 0.8)',
                        color: isUser ? '#0a1929' : '#ffffff',
                        border: isUser ? 'none' : '1px solid #4acbbf'
                    }}>
                        {isUser ? (
                            <p className="text-xs sm:text-sm leading-relaxed font-medium">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className="bg-gray-950 text-gray-100 rounded-lg p-3 overflow-x-auto my-2">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-gray-800 hover:bg-gray-700"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                        toast.success('Copied');
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 text-gray-400" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-gray-900 text-purple-300 text-xs">
                                                {children}
                                            </code>
                                        );
                                    },
                                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
                
                {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <div key={idx}>
                                <FunctionDisplay toolCall={toolCall} />
                                {toolCall.status === 'completed' && <ResultsSection toolCall={toolCall} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}