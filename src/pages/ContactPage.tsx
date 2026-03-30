import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Building, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().min(1, "Please select a subject"),
  company: z.string().max(100).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const contactInfo = [
  { icon: <Mail className="h-5 w-5" />, label: "Email", value: "hello@sparkxindex.com", href: "mailto:hello@sparkxindex.com" },
  { icon: <Phone className="h-5 w-5" />, label: "Phone", value: "+233 (0) 30 000 0000", href: "tel:+233300000000" },
  { icon: <MapPin className="h-5 w-5" />, label: "Headquarters", value: "Accra, Ghana — Serving all of Africa" },
  { icon: <Clock className="h-5 w-5" />, label: "Business Hours", value: "Mon – Fri, 9:00 AM – 6:00 PM GMT" },
];

const offices = [
  { city: "Accra", country: "Ghana", type: "Headquarters" },
  { city: "Lagos", country: "Nigeria", type: "Regional Office" },
  { city: "Nairobi", country: "Kenya", type: "Regional Office" },
  { city: "Cape Town", country: "South Africa", type: "Regional Office" },
];

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        company: result.data.company || null,
        message: result.data.message,
      });
      if (error) throw error;
      setForm({ name: "", email: "", subject: "", company: "", message: "" });
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    setForm({ name: "", email: "", subject: "", company: "", message: "" });
    toast({
      title: "Message Sent!",
      description: "Thank you for reaching out. We'll get back to you within 24 hours.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald/10 via-background to-background" />
        <div className="container relative z-10 py-20 text-center md:py-28">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Get in Touch
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
              Let's Build Africa's Future <span className="text-primary">Together</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Have a question, partnership idea, or want to join the ecosystem? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="pb-12">
        <div className="container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {info.icon}
                </div>
                <p className="text-sm font-medium text-muted-foreground">{info.label}</p>
                {info.href ? (
                  <a href={info.href} className="mt-1 block text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {info.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-foreground">{info.value}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Send Us a Message</h2>
                    <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
                      <Input
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Subject *</label>
                      <Select value={form.subject} onValueChange={(val) => handleChange("subject", val)}>
                        <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="mentorship">Mentorship</SelectItem>
                          <SelectItem value="membership">Membership</SelectItem>
                          <SelectItem value="media">Media & Press</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Company / Organization</label>
                      <Input
                        placeholder="Your company name"
                        value={form.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Message *</label>
                    <Textarea
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-gradient-gold font-semibold text-navy hover:opacity-90" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Map + Offices */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp} className="flex flex-col gap-8">
              {/* Google Map */}
              <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254010.5594684591!2d-0.34117775!3d5.6037168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sAccra%2C%20Ghana!5e0!3m2!1sen!2s!4v1709000000000!5m2!1sen!2s"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SparkX Index Headquarters - Accra, Ghana"
                  className="w-full"
                />
              </div>

              {/* Offices */}
              <div>
                <h3 className="mb-4 font-display text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Our Offices
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offices.map((office, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Building className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold text-sm">{office.city}, {office.country}</p>
                          <p className="text-xs text-muted-foreground">{office.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="bg-navy py-16 text-center">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            Looking for Quick Answers?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            Check out our help center for frequently asked questions, guides, and resources.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
              Visit Help Center
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
