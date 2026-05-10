<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>バランスシート — {{ $user->name }}</title>
<style>
    @page { margin: 18mm 14mm; }
    body {
        font-family: 'ipag', 'IPAGothic', sans-serif;
        font-size: 10pt;
        color: #1f2937;
    }
    h1 { font-size: 16pt; margin: 0 0 4px; }
    .meta { font-size: 9pt; color: #6b7280; margin-bottom: 16px; }
    .net-worth {
        background: #0f172a;
        color: #fff;
        padding: 14px 18px;
        border-radius: 6px;
        margin-bottom: 18px;
    }
    .net-worth .label { font-size: 9pt; opacity: 0.7; }
    .net-worth .amount { font-size: 22pt; font-weight: bold; }
    .net-worth .amount.negative { color: #f87171; }
    .net-worth .amount.positive { color: #4ade80; }

    .section { margin-bottom: 16px; }
    .section h2 {
        font-size: 11pt;
        background: #f3f4f6;
        padding: 6px 10px;
        margin: 0 0 6px;
        border-left: 3px solid #6b7280;
    }
    .section h2.assets      { border-left-color: #16a34a; }
    .section h2.liabilities { border-left-color: #dc2626; }

    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th, td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; text-align: left; font-weight: 600; }
    td.amount, th.amount { text-align: right; }
    .subtotal td {
        font-weight: 600;
        background: #fafafa;
        border-top: 1px solid #d1d5db;
    }
    .total td {
        font-weight: bold;
        background: #fff;
        border-top: 2px solid #1f2937;
        border-bottom: 2px solid #1f2937;
    }
    .empty { color: #9ca3af; font-style: italic; padding: 6px 8px; }
    .footer { font-size: 8pt; color: #9ca3af; text-align: center; margin-top: 24px; }
</style>
</head>
<body>

<h1>バランスシート（B/S）</h1>
<div class="meta">
    {{ $user->name }} 様 ({{ $user->email }})<br>
    出力日時: {{ $generatedAt }}
</div>

<div class="net-worth">
    <div class="label">純資産（ネットワース）</div>
    <div class="amount {{ $bs['net_worth'] >= 0 ? 'positive' : 'negative' }}">
        ¥{{ number_format($bs['net_worth']) }}
    </div>
</div>

<div class="section">
    <h2 class="assets">資産</h2>
    <table>
        <thead>
            <tr>
                <th>カテゴリ</th>
                <th>名称</th>
                <th>メモ</th>
                <th class="amount">金額</th>
            </tr>
        </thead>
        <tbody>
        @foreach (['current', 'fixed', 'investment'] as $cat)
            @php $sec = $bs['assets'][$cat]; @endphp
            @if (count($sec['items']) === 0)
                <tr><td>{{ $sec['label'] }}</td><td colspan="3" class="empty">項目なし</td></tr>
            @else
                @foreach ($sec['items'] as $i => $item)
                    <tr>
                        <td>{{ $i === 0 ? $sec['label'] : '' }}</td>
                        <td>{{ $item['name'] }}</td>
                        <td>{{ $item['note'] ?? '—' }}</td>
                        <td class="amount">¥{{ number_format($item['amount']) }}</td>
                    </tr>
                @endforeach
                <tr class="subtotal">
                    <td colspan="3">{{ $sec['label'] }} 小計</td>
                    <td class="amount">¥{{ number_format($sec['subtotal']) }}</td>
                </tr>
            @endif
        @endforeach
            <tr class="total">
                <td colspan="3">資産合計</td>
                <td class="amount">¥{{ number_format($bs['assets']['total']) }}</td>
            </tr>
        </tbody>
    </table>
</div>

<div class="section">
    <h2 class="liabilities">負債</h2>
    <table>
        <thead>
            <tr>
                <th>カテゴリ</th>
                <th>名称</th>
                <th>メモ</th>
                <th class="amount">金額</th>
            </tr>
        </thead>
        <tbody>
        @foreach (['current', 'longterm'] as $cat)
            @php $sec = $bs['liabilities'][$cat]; @endphp
            @if (count($sec['items']) === 0)
                <tr><td>{{ $sec['label'] }}</td><td colspan="3" class="empty">項目なし</td></tr>
            @else
                @foreach ($sec['items'] as $i => $item)
                    <tr>
                        <td>{{ $i === 0 ? $sec['label'] : '' }}</td>
                        <td>{{ $item['name'] }}</td>
                        <td>{{ $item['note'] ?? '—' }}</td>
                        <td class="amount">¥{{ number_format($item['amount']) }}</td>
                    </tr>
                @endforeach
                <tr class="subtotal">
                    <td colspan="3">{{ $sec['label'] }} 小計</td>
                    <td class="amount">¥{{ number_format($sec['subtotal']) }}</td>
                </tr>
            @endif
        @endforeach
            <tr class="total">
                <td colspan="3">負債合計</td>
                <td class="amount">¥{{ number_format($bs['liabilities']['total']) }}</td>
            </tr>
        </tbody>
    </table>
</div>

<div class="footer">
    Generated by 家計バランスシート — {{ $generatedAt }}
</div>

</body>
</html>
