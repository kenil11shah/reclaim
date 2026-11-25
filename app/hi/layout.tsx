import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource/noto-sans-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-700.css';
import { LocaleProvider } from '@/components/locale';
import { Shell } from '@/components/shell';
import { HtmlLang } from '@/components/html-lang';
import { dictionaries } from '@/lib/i18n';

export default function HiLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale="hi" dict={dictionaries.hi}>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='hi'" }} />
      <HtmlLang lang="hi" />
      <div lang="hi" className="contents">
        <Shell>{children}</Shell>
      </div>
    </LocaleProvider>
  );
}
