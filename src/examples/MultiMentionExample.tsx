import { useState } from 'react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { type SuggestionConfig } from '@/types/suggestions'

const USERS = [
  { id: '1', label: 'John Doe', email: 'john@example.com' },
  { id: '2', label: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', label: 'Mike Johnson', email: 'mike@example.com' },
]

const TAGS = [
  { id: 'urgent', label: 'urgent' },
  { id: 'bug', label: 'bug' },
  { id: 'feature', label: 'feature' },
  { id: 'design', label: 'design' },
]

const COMMANDS = [
  { id: 'todo', label: 'todo', description: 'Create a todo item' },
  { id: 'reminder', label: 'reminder', description: 'Set a reminder' },
  { id: 'link', label: 'link', description: 'Insert a link' },
]

export function MultiMentionExample() {
  const [content, setContent] = useState('')

  const suggestionConfigs: SuggestionConfig[] = [
    {
      char: '@',
      items: ({ query }: { query: string; editor: any }) => 
        USERS.filter(user => 
          user.label.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        ),
      render: (user) => (
        <>
          <div className="suggestion-avatar">
            <div className="suggestion-avatar-placeholder">
              {user.label.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="suggestion-label">{user.label}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
          </div>
        </>
      ),
      maxItems: 5,
      className: 'user-mentions'
    },
    {
      char: '#',
      items: ({ query }: { query: string; editor: any }) => 
        TAGS.filter(tag => 
          tag.label.toLowerCase().includes(query.toLowerCase())
        ),
      render: (tag) => (
        <>
          <div className="suggestion-avatar">
            <div className="suggestion-avatar-placeholder" style={{ backgroundColor: '#059669' }}>
              #
            </div>
          </div>
          <div className="suggestion-label">{tag.label}</div>
        </>
      ),
      maxItems: 5,
      className: 'tag-mentions',
      htmlAttributes: {
        class: 'mention tag-mention',
        style: 'background-color: #dcfce7; color: #059669;'
      }
    },
    {
      char: '/',
      items: ({ query }: { query: string; editor: any }) => 
        COMMANDS.filter(cmd => 
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
        ),
      render: (cmd) => (
        <>
          <div className="suggestion-avatar">
            <div className="suggestion-avatar-placeholder" style={{ backgroundColor: '#7c3aed' }}>
              /
            </div>
          </div>
          <div>
            <div className="suggestion-label">{cmd.label}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{cmd.description}</div>
          </div>
        </>
      ),
      maxItems: 5,
      className: 'command-mentions',
      htmlAttributes: {
        class: 'mention command-mention',
        style: 'background-color: #ede9fe; color: #7c3aed;'
      }
    }
  ]

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Multi-Mention Rich Text Editor</h2>
      <p>Try typing:</p>
      <ul>
        <li><code>@</code> for user mentions</li>
        <li><code>#</code> for tags</li>
        <li><code>/</code> for commands</li>
      </ul>
      
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Type @ for users, # for tags, or / for commands..."
        suggestionConfigs={suggestionConfigs}
        floatingToolbar={true}
      />

      <div style={{ marginTop: '20px' }}>
        <h3>Output HTML:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {content}
        </pre>
      </div>
    </div>
  )
}