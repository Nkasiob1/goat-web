// src/lib/i18n/notes.js
// Phrasebook: translates the English check notes from the server, just before they're shown.
// Each entry: English -> [fr, es, pt, ha, yo, ig]   (ALWAYS this order)

const ORDER = ["fr", "es", "pt", "ha", "yo", "ig"];

// ---------- exact phrases ----------
const PHRASES = {
  // check names (Vet)
  "Honeypot": ["Honeypot", "Honeypot", "Honeypot", "Honeypot", "Honeypot", "Honeypot"],
  "Buy / sell tax": ["Taxe achat / vente", "Impuesto de compra / venta", "Taxa de compra / venda", "Harajin saye / sayarwa", "Owó-orí rírà / títà", "Ụtụ ịzụ / ire"],
  "Contract code": ["Code du contrat", "Código del contrato", "Código do contrato", "Lambar kwantiragi", "Kóòdù contract", "Koodu contract"],
  "Minting": ["Création de tokens", "Emisión (mint)", "Emissão (mint)", "Ƙirƙirar token", "Ìṣẹ̀dá token", "Imepụta token"],
  "Sell limits": ["Limites de vente", "Límites de venta", "Limites de venda", "Iyakar sayarwa", "Ìdíwọ̀n títà", "Oke ire"],
  "Balance control": ["Contrôle des soldes", "Control de saldos", "Controle de saldos", "Ikon canza kuɗi", "Agbára lórí owó", "Njikwa ego"],
  "Hidden owner": ["Propriétaire caché", "Propietario oculto", "Dono oculto", "Mai shi na ɓoye", "Olùní tí ó farapamọ́", "Onye nwe zoro ezo"],
  "Trading pause": ["Pause du trading", "Pausa del trading", "Pausa nas negociações", "Dakatar da ciniki", "Ìdádúró ìṣòwò", "Nkwụsị azụmahịa"],
  "Tax control": ["Contrôle des taxes", "Control de impuestos", "Controle de taxas", "Ikon canza haraji", "Agbára lórí owó-orí", "Njikwa ụtụ"],
  "Blacklist": ["Liste noire", "Lista negra", "Lista negra", "Jerin hana", "Àkójọ ìdílọ́wọ́", "Ndepụta mmachi"],
  "Ownership": ["Propriété", "Propiedad", "Propriedade", "Mallaka", "Ìní", "Onye nwe"],
  "Upgradeable": ["Modifiable", "Actualizable", "Atualizável", "Ana iya sauyawa", "Ó ṣeé yí padà", "Enwere ike ịgbanwe"],
  "Mint authority": ["Autorité de création", "Autoridad de emisión", "Autoridade de emissão", "Ikon ƙirƙira", "Agbára ìṣẹ̀dá", "Ikike imepụta"],
  "Freeze authority": ["Autorité de gel", "Autoridad de congelamiento", "Autoridade de congelamento", "Ikon daskarewa", "Agbára dídì", "Ikike mkpọchi"],
  "Transfers": ["Transferts", "Transferencias", "Transferências", "Tura kuɗi", "Ìfiránṣẹ́", "Mbufe"],
  "Closable": ["Fermable", "Cerrable", "Pode ser fechado", "Ana iya rufewa", "Ó ṣeé tì", "Enwere ike imechi"],
  "Transfer fee": ["Frais de transfert", "Comisión por transferencia", "Taxa de transferência", "Kuɗin turawa", "Owó ìfiránṣẹ́", "Ụgwọ mbufe"],
  "Metadata": ["Métadonnées", "Metadatos", "Metadados", "Bayanan token", "Àlàyé token", "Nkọwa token"],
  "Listed on CoinGecko": ["Listé sur CoinGecko", "Listado en CoinGecko", "Listado no CoinGecko", "Yana kan CoinGecko", "Wà lórí CoinGecko", "Dị na CoinGecko"],
  "Liquidity": ["Liquidité", "Liquidez", "Liquidez", "Liquidity", "Liquidity", "Liquidity"],
  "Age": ["Âge", "Antigüedad", "Idade", "Shekaru", "Ọjọ́-orí", "Afọ"],
  "Price crash": ["Effondrement du prix", "Desplome del precio", "Queda de preço", "Faɗuwar farashi", "Ìwó iye owó", "Ọdịda ọnụahịa"],
  "Contract scan": ["Analyse du contrat", "Análisis del contrato", "Análise do contrato", "Binciken kwantiragi", "Àyẹ̀wò contract", "Nyocha contract"],

  // check details (Vet)
  "Buyers can't sell. This is a trap.": ["Les acheteurs ne peuvent pas revendre. C'est un piège.", "Los compradores no pueden vender. Es una trampa.", "Quem compra não consegue vender. É uma armadilha.", "Masu saye ba za su iya sayarwa ba. Wannan tarko ne.", "Àwọn tó rà kò lè tà á. Ìdẹkùn ni èyí.", "Ndị zụrụ enweghị ike ire. Nke a bụ ọnyà."],
  "A test sell went through.": ["Une vente test a réussi.", "Una venta de prueba se completó.", "Uma venda de teste funcionou.", "Gwajin sayarwa ya yi nasara.", "Títà ìdánwò ṣiṣẹ́.", "Ire nnwale gara nke ọma."],
  "Sell test unavailable for this token.": ["Test de vente indisponible pour ce token.", "Prueba de venta no disponible para este token.", "Teste de venda indisponível para este token.", "Babu gwajin sayarwa don wannan token.", "Kò sí ìdánwò títà fún token yìí.", "Enweghị nnwale ire maka token a."],
  "Tax could not be measured.": ["La taxe n'a pas pu être mesurée.", "No se pudo medir el impuesto.", "Não foi possível medir a taxa.", "Ba a iya auna haraji ba.", "A kò lè wọn owó-orí náà.", "Enweghị ike ịtụ ụtụ ahụ."],
  "The code is not verified, so nobody can read it.": ["Le code n'est pas vérifié, personne ne peut le lire.", "El código no está verificado, nadie puede leerlo.", "O código não é verificado, ninguém consegue lê-lo.", "Ba a tabbatar da lambar ba, babu wanda zai iya karanta ta.", "A kò fìdí kóòdù náà múlẹ̀, kò sí ẹni tó lè kà á.", "Akwadoghị koodu ahụ, ọ dịghị onye nwere ike ịgụ ya."],
  "Verified and public.": ["Vérifié et public.", "Verificado y público.", "Verificado e público.", "An tabbatar kuma a fili yake.", "A ti fìdí rẹ̀ múlẹ̀, ó sì wà ní gbangba.", "Akwadoro ya, ọ dịkwa n'ihu ọha."],
  "The owner can create new tokens and dilute holders.": ["Le propriétaire peut créer de nouveaux tokens et diluer les détenteurs.", "El propietario puede crear nuevos tokens y diluir a los titulares.", "O dono pode criar novos tokens e diluir os detentores.", "Mai shi na iya ƙirƙirar sababbin token ya rage darajar masu riƙe.", "Olùní lè ṣẹ̀dá token tuntun kí ó sì dín iye ti àwọn tó ní in kù.", "Onye nwe nwere ike ịmepụta token ọhụrụ ma belata uru ndị nwere ya."],
  "No one can mint more.": ["Personne ne peut en créer davantage.", "Nadie puede emitir más.", "Ninguém pode emitir mais.", "Babu wanda zai iya ƙirƙirar ƙari.", "Kò sí ẹni tó lè ṣẹ̀dá sí i.", "Ọ dịghị onye nwere ike ịmepụta ọzọ."],
  "Holders can't sell their full balance.": ["Les détenteurs ne peuvent pas vendre la totalité de leur solde.", "Los titulares no pueden vender todo su saldo.", "Os detentores não conseguem vender todo o saldo.", "Masu riƙe ba za su iya sayar da duka kuɗinsu ba.", "Àwọn tó ní in kò lè ta gbogbo rẹ̀.", "Ndị nwere ya enweghị ike ire ego ha niile."],
  "The owner can change wallet balances.": ["Le propriétaire peut modifier les soldes des portefeuilles.", "El propietario puede cambiar los saldos de las billeteras.", "O dono pode alterar os saldos das carteiras.", "Mai shi na iya canza kuɗin da ke cikin walat.", "Olùní lè yí owó inú àpamọ́wọ́ padà.", "Onye nwe nwere ike ịgbanwe ego dị na obere akpa."],
  "Control is hidden behind another address.": ["Le contrôle est caché derrière une autre adresse.", "El control está oculto tras otra dirección.", "O controle está escondido atrás de outro endereço.", "An ɓoye ikon a bayan wani adireshi.", "Agbára ìṣàkóso farapamọ́ lẹ́yìn àdírẹ́sì míràn.", "Ezoro njikwa n'azụ adreesị ọzọ."],
  "The owner can pause all trading.": ["Le propriétaire peut suspendre tout le trading.", "El propietario puede pausar todo el trading.", "O dono pode pausar todas as negociações.", "Mai shi na iya dakatar da duk ciniki.", "Olùní lè dá gbogbo ìṣòwò dúró.", "Onye nwe nwere ike ịkwụsị azụmahịa niile."],
  "The owner can raise the tax at any time.": ["Le propriétaire peut augmenter la taxe à tout moment.", "El propietario puede subir el impuesto en cualquier momento.", "O dono pode aumentar a taxa a qualquer momento.", "Mai shi na iya ƙara haraji a kowane lokaci.", "Olùní lè fi kún owó-orí nígbàkigbà.", "Onye nwe nwere ike ịbawanye ụtụ mgbe ọ bụla."],
  "The owner can block wallets from trading.": ["Le propriétaire peut bloquer des portefeuilles.", "El propietario puede bloquear billeteras para que no operen.", "O dono pode bloquear carteiras de negociar.", "Mai shi na iya hana walat yin ciniki.", "Olùní lè dí àpamọ́wọ́ lọ́wọ́ láti ṣòwò.", "Onye nwe nwere ike igbochi obere akpa ịzụ ahịa."],
  "Renounced ownership can be reclaimed.": ["La propriété abandonnée peut être reprise.", "La propiedad renunciada puede recuperarse.", "A propriedade renunciada pode ser retomada.", "Ana iya dawo da mallakar da aka yi watsi da ita.", "Ìní tí a ti kọ̀ sílẹ̀ ṣeé gbà padà.", "Enwere ike iweghachi onye nwe a hapụrụ."],
  "The code can be swapped later (proxy contract).": ["Le code peut être remplacé plus tard (contrat proxy).", "El código puede cambiarse después (contrato proxy).", "O código pode ser trocado depois (contrato proxy).", "Ana iya sauya lambar daga baya (proxy contract).", "Wọ́n lè pààrọ̀ kóòdù náà lẹ́yìn náà (proxy contract).", "Enwere ike ịgbanwe koodu ahụ ma emechaa (proxy contract)."],
  "New tokens can still be created.": ["De nouveaux tokens peuvent encore être créés.", "Todavía se pueden crear nuevos tokens.", "Novos tokens ainda podem ser criados.", "Har yanzu ana iya ƙirƙirar sababbin token.", "Wọ́n ṣì lè ṣẹ̀dá token tuntun.", "Enwere ike ịmepụta token ọhụrụ ka."],
  "Revoked. Supply is fixed.": ["Révoquée. L'offre est fixe.", "Revocada. El suministro es fijo.", "Revogada. A oferta é fixa.", "An soke. Adadin ya tsaya.", "A ti fagilé e. Iye rẹ̀ ti dúró.", "Ewepụla ya. Ọnụọgụ ya kwụsiri ike."],
  "Your tokens can be frozen so you can't sell.": ["Vos tokens peuvent être gelés et vous empêcher de vendre.", "Tus tokens pueden congelarse y no podrás vender.", "Seus tokens podem ser congelados e você não conseguirá vender.", "Ana iya daskarar da token ɗinka don kada ka sayar.", "Wọ́n lè dí token rẹ kí o má lè tà á.", "Enwere ike ịkpọchi token gị ka ị ghara ire ya."],
  "Revoked.": ["Révoquée.", "Revocada.", "Revogada.", "An soke.", "A ti fagilé e.", "Ewepụla ya."],
  "An authority can change balances.": ["Une autorité peut modifier les soldes.", "Una autoridad puede cambiar los saldos.", "Uma autoridade pode alterar saldos.", "Wani mai iko na iya canza kuɗi.", "Aláṣẹ kan lè yí owó padà.", "Onye nwere ikike nwere ike ịgbanwe ego."],
  "The token can't be transferred.": ["Le token ne peut pas être transféré.", "El token no se puede transferir.", "O token não pode ser transferido.", "Ba za a iya tura token ɗin ba.", "A kò lè fi token náà ránṣẹ́.", "Enweghị ike ibufe token a."],
  "The token program can be closed.": ["Le programme du token peut être fermé.", "El programa del token puede cerrarse.", "O programa do token pode ser fechado.", "Ana iya rufe shirin token ɗin.", "Wọ́n lè ti ètò token náà pa.", "Enwere ike imechi mmemme token a."],
  "A fee is taken on every transfer.": ["Des frais sont prélevés à chaque transfert.", "Se cobra una comisión en cada transferencia.", "Uma taxa é cobrada em cada transferência.", "Ana cire kuɗi a kowace turawa.", "Wọ́n ń gba owó lórí gbogbo ìfiránṣẹ́.", "A na-ewe ụgwọ na mbufe ọ bụla."],
  "The name and logo can be changed.": ["Le nom et le logo peuvent être modifiés.", "El nombre y el logo pueden cambiarse.", "O nome e o logo podem ser alterados.", "Ana iya canza suna da tambari.", "Wọ́n lè yí orúkọ àti àmì náà padà.", "Enwere ike ịgbanwe aha na akara ya."],
  "Tracked by CoinGecko.": ["Suivi par CoinGecko.", "Seguido por CoinGecko.", "Acompanhado pelo CoinGecko.", "CoinGecko na bin sa.", "CoinGecko ń tọpinpin rẹ̀.", "CoinGecko na-esochi ya."],
  "Not listed. Most new coins aren't, but double-check you have the right contract.": ["Non listé. La plupart des nouveaux coins ne le sont pas, mais vérifiez que vous avez le bon contrat.", "No listado. La mayoría de monedas nuevas no lo están, pero comprueba que tienes el contrato correcto.", "Não listado. A maioria das moedas novas não está, mas confira se você tem o contrato certo.", "Ba a jera shi ba. Yawancin sababbin coin ba a jera su ba, amma ka tabbatar kana da kwantiragi daidai.", "Kò sí lórí rẹ̀. Ọ̀pọ̀ coin tuntun kò sí, ṣùgbọ́n rí i dájú pé o ní contract tó tọ́.", "Edepụtaghị ya. Ọtụtụ coin ọhụrụ adịghị, mana jide n'aka na ị nwere contract ziri ezi."],
  "The scanner had no data for this token. Treat it with caution.": ["Le scanner n'a aucune donnée sur ce token. Prudence.", "El escáner no tiene datos de este token. Tómalo con precaución.", "O scanner não tem dados deste token. Tenha cautela.", "Na'urar bincike ba ta da bayani kan wannan token. Ka yi hattara.", "Ẹ̀rọ àyẹ̀wò kò ní àlàyé kankan nípa token yìí. Ṣọ́ra.", "Igwe nyocha enweghị data maka token a. Kpachara anya."],

  // radar notes (from safety.js)
  "No red flags found": ["Aucun signal d'alerte", "Sin señales de alerta", "Nenhum sinal de alerta", "Ba a sami alamar haɗari ba", "A kò rí àmì ewu kankan", "Ahụghị akara ihe ize ndụ ọ bụla"],
  "Chain not covered by safety check": ["Chaîne non couverte par le contrôle", "Cadena no cubierta por el control", "Rede não coberta pela verificação", "Binciken tsaro bai kai wannan chain ba", "Àyẹ̀wò ààbò kò dé chain yìí", "Nyocha nchekwa erughị chain a"],
  "No safety data yet": ["Pas encore de données de sécurité", "Aún no hay datos de seguridad", "Ainda sem dados de segurança", "Babu bayanan tsaro tukuna", "Kò sí àlàyé ààbò síbẹ̀", "Enwebeghị data nchekwa"],
  "Honeypot: you may not be able to sell": ["Honeypot : vous ne pourrez peut-être pas vendre", "Honeypot: puede que no puedas vender", "Honeypot: talvez você não consiga vender", "Honeypot: mai yiwuwa ba za ka iya sayarwa ba", "Honeypot: o lè má lè tà á", "Honeypot: ị nwere ike ọ gaghị enwe ike ire"],
  "Can't sell full balance": ["Impossible de vendre tout le solde", "No se puede vender todo el saldo", "Não é possível vender todo o saldo", "Ba za a iya sayar da duka ba", "Kò ṣeé ta gbogbo rẹ̀", "Enweghị ike ire ego niile"],
  "Owner can change balances": ["Le propriétaire peut modifier les soldes", "El propietario puede cambiar saldos", "O dono pode alterar saldos", "Mai shi na iya canza kuɗi", "Olùní lè yí owó padà", "Onye nwe nwere ike ịgbanwe ego"],
  "Contract can self-destruct": ["Le contrat peut s'autodétruire", "El contrato puede autodestruirse", "O contrato pode se autodestruir", "Kwantiragin na iya lalata kansa", "Contract náà lè pa ara rẹ̀ run", "Contract a nwere ike ibibi onwe ya"],
  "Code not verified": ["Code non vérifié", "Código no verificado", "Código não verificado", "Ba a tabbatar da lambar ba", "A kò fìdí kóòdù múlẹ̀", "Akwadoghị koodu"],
  "Owner can mint more": ["Le propriétaire peut créer plus de tokens", "El propietario puede emitir más", "O dono pode emitir mais", "Mai shi na iya ƙirƙirar ƙari", "Olùní lè ṣẹ̀dá sí i", "Onye nwe nwere ike ịmepụta ọzọ"],
  "Trading can be paused": ["Le trading peut être suspendu", "El trading puede pausarse", "As negociações podem ser pausadas", "Ana iya dakatar da ciniki", "Wọ́n lè dá ìṣòwò dúró", "Enwere ike ịkwụsị azụmahịa"],
  "Has a blacklist": ["A une liste noire", "Tiene lista negra", "Tem lista negra", "Yana da jerin hana", "Ó ní àkójọ ìdílọ́wọ́", "O nwere ndepụta mmachi"],
  "Upgradeable contract": ["Contrat modifiable", "Contrato actualizable", "Contrato atualizável", "Kwantiragi mai sauyawa", "Contract tó ṣeé yí padà", "Contract enwere ike ịgbanwe"],
  "Owner can freeze wallets": ["Le propriétaire peut geler des portefeuilles", "El propietario puede congelar billeteras", "O dono pode congelar carteiras", "Mai shi na iya daskarar da walat", "Olùní lè dí àpamọ́wọ́", "Onye nwe nwere ike ịkpọchi obere akpa"],
  "Token account can be closed": ["Le compte du token peut être fermé", "La cuenta del token puede cerrarse", "A conta do token pode ser fechada", "Ana iya rufe asusun token", "Wọ́n lè ti àkáǹtì token pa", "Enwere ike imechi akaụntụ token"],
  "Has a transfer fee": ["Frais de transfert", "Tiene comisión por transferencia", "Tem taxa de transferência", "Yana da kuɗin turawa", "Ó ní owó ìfiránṣẹ́", "O nwere ụgwọ mbufe"],
};

// ---------- phrases with numbers: (\S+) / (\d+) capture the number, {1} {2} put it back ----------
const PATTERNS = [
  { re: /^Buy ([\d.]+)% · Sell ([\d.]+)%$/, out: ["Achat {1} % · Vente {2} %", "Compra {1}% · Venta {2}%", "Compra {1}% · Venda {2}%", "Saye {1}% · Sayarwa {2}%", "Rírà {1}% · Títà {2}%", "Ịzụ {1}% · Ire {2}%"] },
  { re: /^Ranked #(\d+) by market cap\.$/, out: ["Classé n°{1} par capitalisation.", "Puesto n.º {1} por capitalización.", "Posição nº {1} em capitalização.", "Na {1} a darajar kasuwa.", "Ipò {1} nínú iye ọjà.", "Nke {1} n'uru ahịa."] },
  { re: /^Only (\S+)\. Easy to manipulate and hard to exit\.$/, out: ["Seulement {1}. Facile à manipuler et difficile à revendre.", "Solo {1}. Fácil de manipular y difícil de salir.", "Apenas {1}. Fácil de manipular e difícil de sair.", "{1} kaɗai. Mai sauƙin juyawa kuma da wuyar fita.", "{1} nìkan. Ó rọrùn láti ṣe màgòmágó, ó sì ṣòro láti jáde.", "Naanị {1}. Ọ dị mfe ịgbagọ, ọ sikwa ike ịpụ."] },
  { re: /^(\S+)\. Thin, so big orders will move the price\.$/, out: ["{1}. Faible : les gros ordres feront bouger le prix.", "{1}. Escasa: las órdenes grandes moverán el precio.", "{1}. Baixa: ordens grandes vão mexer no preço.", "{1}. Ƙanƙanta: manyan oda za su motsa farashi.", "{1}. Kò pọ̀: àwọn àṣẹ ńlá máa yí iye owó padà.", "{1}. Dị ntakịrị: nnukwu ịzụ ahịa ga-agbanwe ọnụahịa."] },
  { re: /^(\S+) in the main pool\.$/, out: ["{1} dans le pool principal.", "{1} en el pool principal.", "{1} no pool principal.", "{1} a babban pool.", "{1} nínú pool àkọ́kọ́.", "{1} n'ime isi pool."] },
  { re: /^Launched (\d+)h ago\. Most rugs happen early\.$/, out: ["Lancé il y a {1} h. La plupart des rug pulls arrivent tôt.", "Lanzado hace {1} h. La mayoría de los rug pulls ocurren pronto.", "Lançado há {1} h. A maioria dos golpes acontece cedo.", "An ƙaddamar awa {1} da suka wuce. Yawancin zamba na faruwa da wuri.", "A ṣe ìfilọ́lẹ̀ rẹ̀ ní wákàtí {1} sẹ́yìn. Ọ̀pọ̀ jìbìtì máa ń ṣẹlẹ̀ ní kùtùkùtù.", "Malitere awa {1} gara aga. Ọtụtụ aghụghọ na-eme n'oge mbụ."] },
  { re: /^Trading for (\d+) days\.$/, out: ["En circulation depuis {1} jours.", "Cotiza desde hace {1} días.", "Negociado há {1} dias.", "Ana ciniki tsawon kwana {1}.", "Wọ́n ti ń ṣòwò rẹ̀ fún ọjọ́ {1}.", "A na-azụ ya kemgbe ụbọchị {1}."] },
  { re: /^Down (\d+)% from its peak\. Early holders may have dumped\.$/, out: ["En baisse de {1} % depuis son sommet. Les premiers détenteurs ont peut-être vendu.", "Cae un {1}% desde su máximo. Los primeros titulares quizá vendieron.", "Caiu {1}% desde o pico. Os primeiros detentores podem ter vendido.", "Ya faɗi da {1}% daga ƙolinsa. Mai yiwuwa masu riƙe na farko sun sayar.", "Ó ti wálẹ̀ ní {1}% láti góńgó rẹ̀. Àwọn tó kọ́kọ́ ní in lè ti tà á.", "Ọ dalatala {1}% site n'elu ya. Ndị mbụ nwere ya nwere ike ịre ya."] },
  { re: /^High tax \((\d+)%\)$/, out: ["Taxe élevée ({1} %)", "Impuesto alto ({1}%)", "Taxa alta ({1}%)", "Haraji mai yawa ({1}%)", "Owó-orí gíga ({1}%)", "Ụtụ dị elu ({1}%)"] },
  { re: /^Tax (\d+)%$/, out: ["Taxe {1} %", "Impuesto {1}%", "Taxa {1}%", "Haraji {1}%", "Owó-orí {1}%", "Ụtụ {1}%"] },
  { re: /^New (\S+) spot listing$/, out: ["Nouveau listing spot sur {1}", "Nuevo listado spot en {1}", "Nova listagem spot na {1}", "Sabon jeri a {1}", "Tuntun lórí {1}", "Ndepụta ọhụrụ na {1}"] },
];

// ---------- the extra sentence vet.js adds for established coins like USDT ----------
const SUFFIX_EN = " Normal for a centrally issued coin, but the issuer holds this power.";
const SUFFIX = [
  " Normal pour un coin émis de façon centralisée, mais l'émetteur détient ce pouvoir.",
  " Normal en una moneda de emisión centralizada, pero el emisor tiene este poder.",
  " Normal para uma moeda emitida de forma centralizada, mas o emissor tem esse poder.",
  " Al'ada ne ga coin da wata hukuma ke fitarwa, amma mai fitarwa yana da wannan iko.",
  " Èyí wọ́pọ̀ fún coin tí àjọ kan ń gbé jáde, ṣùgbọ́n olùgbéjáde ní agbára yìí.",
  " Ọ bụ ihe nkịtị maka coin otu ụlọ ọrụ na-ewepụta, mana onye na-ewepụta ya nwere ike a.",
];

// Translate one English note. Unknown text comes back unchanged (English), so nothing ever breaks.
export function translateNote(text, lang) {
  if (!text || lang === "en") return text;                 // English: nothing to do
  const i = ORDER.indexOf(lang);                           // which column: fr=0, es=1...
  if (i < 0) return text;                                  // a language we don't cover
  if (text.endsWith(SUFFIX_EN)) {                          // "…dilute holders. Normal for a centrally…"
    return translateNote(text.slice(0, -SUFFIX_EN.length), lang) + SUFFIX[i]; // translate both halves
  }
  if (PHRASES[text]) return PHRASES[text][i];              // 1) exact phrase
  for (const p of PATTERNS) {                              // 2) phrase with numbers
    const m = text.match(p.re);
    if (m) return p.out[i].replace(/\{(\d)\}/g, (_, n) => m[n]); // put the captured numbers back
  }
  return text;                                             // 3) unknown: show the English
}