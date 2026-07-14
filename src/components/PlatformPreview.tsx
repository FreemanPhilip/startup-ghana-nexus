import { motion } from "framer-motion";
import { BarChart3, Building2, Users, MessageSquare, MousePointerClick } from "lucide-react";

const previews = [
  {
    title: "Ecosystem Dashboard",
    description: "Real-time intelligence on Africa's startup landscape",
    icon: BarChart3,
    gradient: "from-emerald/20 via-emerald/5 to-transparent",
    iconColor: "text-emerald",
    lines: [
      { w: "60%", h: "6px", color: "bg-emerald/20" },
      { w: "85%", h: "4px", color: "bg-muted" },
      { w: "70%", h: "4px", color: "bg-muted" },
      { w: "45%", h: "4px", color: "bg-muted" },
    ],
    bars: true,
  },
  {
    title: "Startup Profile",
    description: "Showcase your venture to investors and partners",
    icon: Building2,
    gradient: "from-gold/20 via-gold/5 to-transparent",
    iconColor: "text-gold",
    lines: [
      { w: "50%", h: "8px", color: "bg-gold/20" },
      { w: "90%", h: "4px", color: "bg-muted" },
      { w: "75%", h: "4px", color: "bg-muted" },
      { w: "60%", h: "4px", color: "bg-muted" },
    ],
    bars: false,
  },
  {
    title: "Smart Networking",
    description: "Connect with verified ecosystem players",
    icon: Users,
    gradient: "from-primary/20 via-primary/5 to-transparent",
    iconColor: "text-primary",
    lines: [
      { w: "55%", h: "6px", color: "bg-primary/20" },
      { w: "80%", h: "4px", color: "bg-muted" },
      { w: "65%", h: "4px", color: "bg-muted" },
    ],
    bars: false,
    circles: true,
  },
  {
    title: "Direct Messaging",
    description: "Private conversations that close deals",
    icon: MessageSquare,
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    iconColor: "text-blue-500",
    lines: [
      { w: "40%", h: "6px", color: "bg-blue-500/20" },
      { w: "70%", h: "4px", color: "bg-muted" },
      { w: "55%", h: "4px", color: "bg-muted" },
    ],
    bars: false,
    bubbles: true,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const PlatformPreview = () => {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <MousePointerClick className="h-3 w-3" />
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            A Platform Built for Africa's{" "}
            <span className="text-gradient-gold">Innovators</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From discovery to funding, every tool you need to navigate the startup ecosystem — in one place.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {previews.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-gold/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2">sparkx.global</span>
              </div>

              <div className={`relative p-8 bg-gradient-to-br ${item.gradient} min-h-[200px] flex flex-col items-center justify-center`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm border border-border mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>

                {item.bars && (
                  <div className="w-full max-w-[180px] flex items-end gap-2 mt-2">
                    {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/30"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                )}

                {item.circles && (
                  <div className="flex -space-x-3 mt-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center"
                      >
                        <Users className="h-3 w-3 text-primary/60" />
                      </div>
                    ))}
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                      <span className="text-[8px] font-bold text-muted-foreground">+12</span>
                    </div>
                  </div>
                )}

                {item.bubbles && (
                  <div className="flex flex-col gap-2 w-full max-w-[180px] mt-2">
                    <div className="self-end rounded-2xl rounded-br-sm bg-blue-500/20 px-3 py-1.5">
                      <div className="h-2 w-16 rounded bg-blue-500/30" />
                    </div>
                    <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-1.5">
                      <div className="h-2 w-20 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="self-end rounded-2xl rounded-br-sm bg-blue-500/20 px-3 py-1.5">
                      <div className="h-2 w-12 rounded bg-blue-500/30" />
                    </div>
                  </div>
                )}

                {!item.bars && !item.circles && !item.bubbles && (
                  <div className="w-full max-w-[180px] space-y-2 mt-2">
                    {item.lines.map((line, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded ${line.color}`}
                        style={{ width: line.w }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <h3 className="font-display font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PlatformPreview;
