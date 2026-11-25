import { LocaleProvider } from '@/components/locale';
import { Shell } from '@/components/shell';
import { HtmlLang } from '@/components/html-lang';
import { dictionaries } from '@/lib/i18n';

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale="en" dict={dictionaries.en}>
      <HtmlLang lang="en" />
      <Shell>{children}</Shell>
    </LocaleProvider>
  );
}
