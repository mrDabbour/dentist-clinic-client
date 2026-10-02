import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy } from '@angular/core';
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appCountUp = 0;
  private observer?: IntersectionObserver;
  private frame = 0;
  private visible = false;
  constructor(private element: ElementRef<HTMLElement>, private zone: NgZone) {}
  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      this.visible = true; this.render(this.appCountUp); return;
    }
    this.render(0);
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { this.visible = true; this.observer?.disconnect(); this.animate(); }
    }, { threshold: .3 });
    this.observer.observe(this.element.nativeElement);
  }
  ngOnChanges(): void { if (this.visible) this.animate(); }
  private render(value: number): void { this.element.nativeElement.textContent = Math.max(0, Math.round(value)).toLocaleString(); }
  private animate(): void {
    cancelAnimationFrame(this.frame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this.render(this.appCountUp); return; }
    const start = performance.now(); const target = this.appCountUp;
    const draw = (now: number) => {
      const progress = Math.min((now - start) / 1100, 1);
      this.render(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) this.frame = requestAnimationFrame(draw);
    };
    this.zone.runOutsideAngular(() => { this.frame = requestAnimationFrame(draw); });
  }
  ngOnDestroy(): void { this.observer?.disconnect(); cancelAnimationFrame(this.frame); }
}
